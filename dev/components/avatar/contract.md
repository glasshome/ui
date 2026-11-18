# Avatar: behaviour contract

Each line is one browser test in `tests/contracts/avatar.contract.test.tsx`, named by its id. Tests read roles, names, markup and `data-*` markers, never classes. Baseline written on Kobalte before Avatar left it.

| id | when | then |
|---|---|---|
| AV1 | no image | the root (`data-slot="avatar"`) is a `span` holding the fallback (`data-slot="avatar-fallback"`) and no `img` |
| AV2 | an image that loads | the fallback shows until the photo has loaded, then the `img` (`data-slot="avatar-image"`) named by its `alt` replaces it |
| AV3 | an image that fails | the fallback stays and no `img` renders |
| AV4 | `fallbackDelay` | the fallback appears only once the delay has passed |
| AV5 | `onLoadingStatusChange` | it hears `loading`, then `loaded` or `error` |
| AV6 | the source changes | the fallback returns until the new photo loads |
