/**
 * A known gap as a plain test: passes only while `body` fails with the recorded message.
 * ui cannot import @glasshome/config, so this is the ui copy of its expectGap.
 */
export async function expectGap(body: () => unknown, recorded: string): Promise<void> {
  let message: string | undefined;
  try {
    await body();
  } catch (error) {
    message = normalize(error instanceof Error ? error.message : JSON.stringify(error));
  }
  if (message === undefined)
    throw new Error("gap closed: drop expectGap and record what now holds in its work item");
  if (!message.includes(normalize(recorded)))
    throw new Error(`gap failed differently. Recorded:\n${recorded}\nNow:\n${message}`);
}

const normalize = (text: string) =>
  text
    // oxlint-disable-next-line no-control-regex -- strips the colour codes the matchers print
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/\s+/g, " ")
    .trim();
