import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	type Identifier,
	isIdentifier,
	isJsxAttribute,
	isJsxElement,
	isJsxSelfClosingElement,
	isStringLiteral,
	type JsxOpeningElement,
	type JsxSelfClosingElement,
	type Node,
} from "typescript/unstable/ast";
import {
	API,
	type Checker,
	SignatureKind,
	SymbolFlags,
	type Symbol as TsSymbol,
} from "typescript/unstable/async";
import { ALLOW } from "../dev/coverage-allow";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = join(pkg, "tsconfig.test.json");
const ENTRY = join(pkg, "src/solid/index.ts");
const GROUPS = join(pkg, "dev/groups");
const SCREAMING_CASE = /^[A-Z][A-Z0-9_]*$/;

export type Component = { name: string; module: string };
export type SpecimenUse = { name: string; renders: string[] };
export type Inventory = { exports: string[]; components: Component[]; specimens: SpecimenUse[] };
export type Report = {
	uncovered: string[];
	unknownSpecimens: string[];
	emptyReasons: string[];
	staleAllows: string[];
};
type Allow = ReadonlyArray<readonly [name: string, reason: string]>;

export function judge(inventory: Inventory, allow: Allow): Report {
	const moduleOf = new Map(inventory.components.map((c) => [c.name, c.module]));
	const named = new Set(inventory.specimens.map((s) => s.name));
	const exportNames = new Set(inventory.exports);
	const renderedByOwnModule = (c: Component) =>
		inventory.specimens.some(
			(s) => moduleOf.get(s.name) === c.module && s.renders.includes(c.name),
		);
	const uncovered = inventory.components
		.filter((c) => !named.has(c.name) && !renderedByOwnModule(c))
		.map((c) => c.name);
	const unknown = [...named].filter((name) => !exportNames.has(name));
	const allowed = new Set(allow.map(([name]) => name));
	const failing = new Set([...uncovered, ...unknown]);
	return {
		uncovered: uncovered.filter((name) => !allowed.has(name)),
		unknownSpecimens: unknown.filter((name) => !allowed.has(name)),
		emptyReasons: allow.filter(([, reason]) => reason.trim() === "").map(([name]) => name),
		staleAllows: allow.filter(([name]) => !failing.has(name)).map(([name]) => name),
	};
}

async function resolveAlias(checker: Checker, symbol: TsSymbol): Promise<TsSymbol> {
	return symbol.flags & SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

async function returnsJsx(checker: Checker, symbol: TsSymbol): Promise<boolean> {
	const type = await checker.getTypeOfSymbol(symbol);
	if (!type) return false;
	const signatures = await checker.getSignaturesOfType(type, SignatureKind.Call);
	if (signatures.length === 0) return false;
	for (const signature of signatures) {
		const returned = await checker.getReturnTypeOfSignature(signature);
		const alias = await returned?.getAliasSymbol();
		const namespace = await alias?.getParent();
		if (alias?.name !== "Element" || namespace?.name !== "JSX") return false;
	}
	return true;
}

function openingOf(node: Node): JsxOpeningElement | JsxSelfClosingElement | undefined {
	if (isJsxElement(node)) return node.openingElement;
	return isJsxSelfClosingElement(node) ? node : undefined;
}

function jsxTag(node: Node): Identifier | undefined {
	const opening = openingOf(node);
	return opening && isIdentifier(opening.tagName) ? opening.tagName : undefined;
}

function specimenName(node: Node): string | undefined {
	const opening = openingOf(node);
	if (!opening || jsxTag(node)?.text !== "Specimen") return undefined;
	for (const attribute of opening.attributes.properties) {
		if (!isJsxAttribute(attribute) || !isIdentifier(attribute.name)) continue;
		if (attribute.name.text !== "name") continue;
		return attribute.initializer && isStringLiteral(attribute.initializer)
			? attribute.initializer.text
			: "{non-literal name}";
	}
	return "{no name}";
}

export async function collectInventory(): Promise<Inventory> {
	const api = new API({ cwd: pkg });
	try {
		const snapshot = await api.updateSnapshot({ openProjects: [CONFIG] });
		const project = snapshot.getProject(CONFIG);
		if (!project) throw new Error(`typescript did not load ${CONFIG}`);
		const { checker, program } = project;

		const entry = await program.getSourceFile(ENTRY);
		const entrySymbol = entry && (await checker.getSymbolAtLocation(entry));
		if (!entrySymbol) throw new Error(`typescript did not load ${ENTRY}`);

		const exports: string[] = [];
		const components: Component[] = [];
		const exportsByTarget = new Map<number, string[]>();
		for (const exported of await checker.getExportsOfModule(entrySymbol)) {
			const target = await resolveAlias(checker, exported);
			if (!(target.flags & SymbolFlags.Value)) continue;
			exports.push(exported.name);
			if (SCREAMING_CASE.test(exported.name) || !(await returnsJsx(checker, target))) continue;
			const declaration = target.valueDeclaration ?? target.declarations[0];
			components.push({ name: exported.name, module: declaration?.path ?? "" });
			exportsByTarget.set(target.id, [...(exportsByTarget.get(target.id) ?? []), exported.name]);
		}

		const specimens = new Map<string, Set<string>>();
		for (const file of readdirSync(GROUPS).filter((f) => f.endsWith(".tsx"))) {
			const source = await program.getSourceFile(join(GROUPS, file));
			if (!source) throw new Error(`typescript did not load dev/groups/${file}`);
			const tags: Array<{ specimen: string; tag: Node }> = [];
			const visit = (node: Node, specimen: string | undefined) => {
				const name = specimenName(node);
				const inside = name ?? specimen;
				if (name !== undefined && !specimens.has(name)) specimens.set(name, new Set());
				const tag = name === undefined ? jsxTag(node) : undefined;
				if (tag && inside) tags.push({ specimen: inside, tag });
				node.forEachChild((child) => {
					visit(child, inside);
				});
			};
			visit(source, undefined);

			const symbols = await checker.getSymbolAtLocation(tags.map((t) => t.tag));
			for (const [i, symbol] of symbols.entries()) {
				const use = tags[i];
				if (!symbol || !use) continue;
				const target = await resolveAlias(checker, symbol);
				for (const exported of exportsByTarget.get(target.id) ?? []) {
					specimens.get(use.specimen)?.add(exported);
				}
			}
		}

		return {
			exports,
			components,
			specimens: [...specimens].map(([name, renders]) => ({ name, renders: [...renders] })),
		};
	} finally {
		await api.close();
	}
}

export async function galleryReport(allow: Allow = ALLOW): Promise<Report> {
	return judge(await collectInventory(), allow);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const report = await galleryReport();
	const failures = [
		...report.uncovered.map(
			(name) => `${name}: component export with no <Specimen name="${name}">`,
		),
		...report.unknownSpecimens.map(
			(name) => `<Specimen name="${name}">: not an export of src/solid`,
		),
		...report.emptyReasons.map((name) => `dev/coverage-allow.ts ${name}: empty reason`),
		...report.staleAllows.map(
			(name) => `dev/coverage-allow.ts ${name}: nothing to allow any more, drop the entry`,
		),
	];
	if (failures.length > 0) {
		console.error(`check:gallery, ${failures.length} failing:\n${failures.join("\n")}`);
		process.exit(1);
	}
	console.log("check:gallery: every component export has a specimen");
}
