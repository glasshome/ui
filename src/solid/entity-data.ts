import { type Accessor, createContext, useContext } from "solid-js";

/**
 * Structural view types for the smart-home pickers (EntitySelector,
 * AreaPicker). They are subsets of @glasshome/sync-layer's EntityView /
 * AreaView, owned here so the design system carries no dependency on the HA
 * data runtime: the host supplies a live implementation through
 * EntityDataContext (dash wires sync-layer in; the dev gallery wires static
 * demo data).
 */
export interface EntityViewLike {
	id: string;
	/** Current state value (e.g. "on", "21.5"). */
	state: string;
	/** Entity name (registry name or friendly_name). */
	name: string;
	friendlyName: string;
	aliases: readonly string[];
	areaId: string | null;
	/** Resolved icon name (e.g. "mdi:lightbulb"). */
	icon: string | null;
	/** "config" | "diagnostic" for non-primary entities, null for regular ones. */
	entityCategory: string | null;
	isHidden: boolean;
	isDisabled: boolean;
	deviceClass?: string | null;
	unitOfMeasurement?: string | null;
}

export interface AreaViewLike {
	id: string;
	name: string;
	icon: string | null;
	entityIds: readonly string[];
}

/**
 * Live entity/area data source provided by the host app. All members are
 * reactive under Solid tracking scopes; `useEntities` is a lazy subscription
 * keyed on the id list, so a picker only subscribes to what it shows.
 */
export interface EntityDataAdapter {
	/** Entity ids grouped by domain (e.g. { light: ["light.kitchen"] }). */
	entityIdsByDomain: Accessor<Record<string, string[]>>;
	/** Subscribe to live views for a reactive id list. */
	useEntities(entityIds: Accessor<string[]>): Accessor<EntityViewLike[]>;
	/** Point read of one entity's live view; reactive when called in a tracking scope. */
	getEntityView(entityId: string): EntityViewLike | undefined;
	/** All areas of the home. */
	useAreas(): Accessor<AreaViewLike[]>;
}

export const EntityDataContext = createContext<EntityDataAdapter>();

/**
 * Module-level fallback for render roots the host's context provider cannot
 * reach: widget sandboxes mount their own Solid roots (and render SchemaForm /
 * EntitySelector inside them), but they resolve this module through the host
 * import map, so it is the same singleton the host registered into.
 */
let defaultAdapter: EntityDataAdapter | undefined;

/** Host apps call this once at startup; EntityDataContext overrides it per-tree. */
export function provideEntityData(adapter: EntityDataAdapter): void {
	defaultAdapter = adapter;
}

export function useEntityData(): EntityDataAdapter {
	const adapter = useContext(EntityDataContext) ?? defaultAdapter;
	if (!adapter) {
		throw new Error(
			"useEntityData: no entity data source. Call provideEntityData(adapter) " +
				"at app startup or wrap the tree in <EntityDataContext.Provider> " +
				"(dash registers a @glasshome/sync-layer-backed adapter).",
		);
	}
	return adapter;
}
