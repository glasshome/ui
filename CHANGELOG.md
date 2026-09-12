# Changelog

## Unreleased

Hand-written; drop this section once release-please cuts the version from the commits.


### Bug Fixes

* **theme:** relight the light-theme semantic roles to pass WCAG AA. `--success`, `--warning`, `--destructive` and `--ring` were high-lightness values tuned for the dark ground, measuring 2.81:1, 2.09:1, 3.59:1 and 3.50:1 against the light `--background` — under the 4.5:1 text floor (3:1 for a focus indicator). Hue held, lightness dropped: now 5.24:1, 5.17:1, 5.21:1 and 4.68:1 (5.56 / 5.49 / 5.53 / 4.97 against `--card`), and white on the destructive fill goes 3.85:1 to 5.59:1. Dark theme unchanged.

* **switch:** stop an off switch reading as on. The thumb was painted `var(--primary)` in both states, so an unchecked switch showed a filled accent knob; off now takes `--muted-foreground`.

* **input:** stop light-theme fields reading as disabled. A field fill of L=0.9 under an L=0.995 card is the nine-point drop this library spends on `disabled`, and the 60%-alpha edge left nothing else to read the boundary by. `INPUT_SURFACE` now takes its fill and edge from a theme-owned `--field` / `--field-edge` pair: light fields sit at the card with a solid `--border` edge, dark fields keep the dug-out `--input` fill and the soft edge, and `.glass-sink` still supplies the recess in both.


### Features

* **input-classes:** add `FIELD_CHROME`, the recipe SPEC.md already documented. Toggle chrome and rails (checkbox box, radio ring, switch track, slider rail, chart wells) wear it and stay keyed to `--input` in both themes, so they keep reading as empty wells now that fields do not.

## [1.14.0](https://github.com/glasshome/ui/compare/v1.13.0...v1.14.0) (2026-09-12)


### Features

* **dock:** pages by whole items, a hold fill, and a rim for a mode ([05242cd](https://github.com/glasshome/ui/commit/05242cd2d8baf59b402c61cac6f508c7340fb463))
* **schema-form:** choices, labels, and rows named by their kind ([3802045](https://github.com/glasshome/ui/commit/38020451faac4a682c49d81ad1f197c64fb0c041))


### Bug Fixes

* **deps:** the json-schema types ship as a dependency ([4295398](https://github.com/glasshome/ui/commit/42953987959a4c51b0b1fe7b50a4c9dc737cbd1e))

## [1.13.0](https://github.com/glasshome/ui/compare/v1.12.0...v1.13.0) (2026-09-12)


### Features

* **gallery:** a floating top bar carries the areas ([4283668](https://github.com/glasshome/ui/commit/428366858a3fff728f42b5b231907fe571b086d0))
* **gallery:** a specimen for every component export, and triggers that resolve ([0d68aed](https://github.com/glasshome/ui/commit/0d68aeda4ab7e1578f0ff9819e30c928560510c4))
* **gallery:** coverage gate and trigger verification in CI ([fcf914c](https://github.com/glasshome/ui/commit/fcf914c76af743bb06280495238cd5f1b95d056d))
* **gallery:** dashboard and entity modal screens ([f93025e](https://github.com/glasshome/ui/commit/f93025e6252ae72edb70cc24fb3f9e56e2312bf7))
* **gallery:** foundations area ([6113f18](https://github.com/glasshome/ui/commit/6113f189f3cbaf0d12de12907ab816114feb10b2))
* **gallery:** iframe width stage ([1f06fef](https://github.com/glasshome/ui/commit/1f06fef17ced56313d8a223b1a2ffced6cc4c8f4))
* **gallery:** settings and wizard screens ([3a4ba70](https://github.com/glasshome/ui/commit/3a4ba70bb3217f6811adbfeaa9c16167f897de07))
* **gallery:** shared demo fixtures ([969ec9a](https://github.com/glasshome/ui/commit/969ec9a261fbcc8b6f33807f74fd7a4cfc661cf8))
* **gallery:** shoot routes, stages, reduced motion and trigger verification ([ece13ef](https://github.com/glasshome/ui/commit/ece13ef7bf10403034713345c26440689d0dc7ae))
* **gallery:** Specimen and Axis ([311b06c](https://github.com/glasshome/ui/commit/311b06c4c53f028251b3ced221e0ee3fe6471894))
* **gallery:** the dashboard screen shows live readings, not a catalog ([c7fa320](https://github.com/glasshome/ui/commit/c7fa320a693554b67abc1532cc81b3caa0eef48e))
* **gallery:** the dashboard's blocks are named exports ([79c10fa](https://github.com/glasshome/ui/commit/79c10fa7f02c3b441487dfca335161a3b128ab9f))
* **gallery:** the dock carries areas, the top bar carries pages ([b2713fd](https://github.com/glasshome/ui/commit/b2713fdcd27576daab3e41b8014882f9a3773055))
* **gallery:** three areas behind a hash router ([04fd2d1](https://github.com/glasshome/ui/commit/04fd2d198276f35ca1dc26f6e1a135ebc4cd2257))
* **gallery:** wire the foundations entries ([0049593](https://github.com/glasshome/ui/commit/004959357b7adc0c5901144d945d4a8aa5bc7985))
* **gallery:** wire the screens through the width stage ([347a9a3](https://github.com/glasshome/ui/commit/347a9a341ef97236e8394f1d58b89bd4da461236))


### Bug Fixes

* **gallery:** serve a favicon so the tab stops 404ing ([7d55c23](https://github.com/glasshome/ui/commit/7d55c2397024dd04dbcadf24368b8d1c5aed7e78))
* **gallery:** shoot clicks the stage, not the header chip ([64a86c6](https://github.com/glasshome/ui/commit/64a86c69b07aab2f08fba104c4e6fb0bbcccc27b))
* **gallery:** typecheck dev/ and bundle real icons ([c2fc978](https://github.com/glasshome/ui/commit/c2fc978a0af87de1af9f8cbd796a2acb9d160dc5))

## [1.12.0](https://github.com/glasshome/ui/compare/v1.11.0...v1.12.0) (2026-09-07)


### Features

* **theme:** --motion-play pauses a loop the ambient number cannot shorten ([6266892](https://github.com/glasshome/ui/commit/6266892547937ab3952a9057b9c82f226a84822b))

## [1.11.0](https://github.com/glasshome/ui/compare/v1.10.1...v1.11.0) (2026-09-07)


### Features

* **icon:** one inline-svg Icon fed by the host's icon source ([6ae5bcb](https://github.com/glasshome/ui/commit/6ae5bcbd32ac72da5a7dd045f4979b66b7b5c3c5))
* **theme:** --motion-ambient carries the host's motion window into widget shadow roots ([bbe44f0](https://github.com/glasshome/ui/commit/bbe44f0ac45ac2683df4e3c454798289acb2f60b))

## [1.10.1](https://github.com/glasshome/ui/compare/v1.10.0...v1.10.1) (2026-09-06)


### Bug Fixes

* ship the source the solid export condition points at ([3e41fde](https://github.com/glasshome/ui/commit/3e41fde009492f37266e30a84f81cf40c59b5a69))

## [1.10.0](https://github.com/glasshome/ui/compare/v1.9.0...v1.10.0) (2026-09-06)


### Features

* solid export condition, Card ornament, own Icon over iconify-icon ([e238462](https://github.com/glasshome/ui/commit/e2384625ac3b03f8c718aedefd01bd9a10b74f4b))

## [1.9.0](https://github.com/glasshome/ui/compare/v1.8.0...v1.9.0) (2026-09-05)


### Features

* **section-card:** SectionGroup owns labelled groups inside a card ([ce681d4](https://github.com/glasshome/ui/commit/ce681d4419cea08def38ec3a930639a4fc737337))
* **theme:** the warning tint, love, caveat and bebas are theme tokens ([496e519](https://github.com/glasshome/ui/commit/496e519ff47fae5d1f0504484d941a41a66199a5))

## [1.8.0](https://github.com/glasshome/ui/compare/v1.7.0...v1.8.0) (2026-09-03)


### Features

* **section-card:** ListRow, one shape for every settings list ([b1d8df3](https://github.com/glasshome/ui/commit/b1d8df34e7c14f89afa8f70f1d967536e5785654))


### Bug Fixes

* **alert:** the action centers against a multi-line body ([f1e6326](https://github.com/glasshome/ui/commit/f1e63268e200acd6eb7e33756739e0c8b7986f32))
* **sliding-indicator:** ignore a zero-size measure, retry on the next frame ([6c92807](https://github.com/glasshome/ui/commit/6c92807b38e9d8b11493891f5aba8322a196ea6f))
* **switch:** light wears the same on-knob tint as dark ([3549e9d](https://github.com/glasshome/ui/commit/3549e9d292bd4655de5569760b8564d83906c2ce))
* **switch:** one knob material, the track carries the state ([075b3fc](https://github.com/glasshome/ui/commit/075b3fc2a8048fce9ec70a655d62644b7678d4a1))
* **switch:** the knob dims when off, and stops matching foreground when on ([b1f2c49](https://github.com/glasshome/ui/commit/b1f2c49e49b8107815d3a5f5d94812c8da81a767))
* **switch:** the on knob reads lit through hue, not brightness ([cd4ba31](https://github.com/glasshome/ui/commit/cd4ba315aef5a12a35e071635ff06760a749b7a3))
* **tests:** answer iconify's fetches instead of reaching the network ([6622088](https://github.com/glasshome/ui/commit/66220887b4c0990a9b04e96ee16ecc63ecf86106))
* **theme:** light gets a surface ladder, and the ring follows primary ([5f45fce](https://github.com/glasshome/ui/commit/5f45fceabafaf103947854e29d0b58038c7aadd7))

## [1.7.0](https://github.com/glasshome/ui/compare/v1.6.0...v1.7.0) (2026-08-29)


### Features

* **charts:** tooltip wears Overlay, tone-driven segments, one well radius ([c4f22bb](https://github.com/glasshome/ui/commit/c4f22bba7e61a3c9a07cd7ba2d64aea7bf06b095))
* **compat:** keep HeroOption, BottomSheetHeader/Footer and Sheet bottom as deprecated aliases ([2b939fb](https://github.com/glasshome/ui/commit/2b939fb4e87e48e9d6ff9a7e6e4360284072a039))
* **dialog:** Header wrap, and one shot for the media and tab-row slots ([1d3fc58](https://github.com/glasshome/ui/commit/1d3fc588f354eacdec25fe7699778ad709f5f2e3))
* **dialog:** one modal part set for every family, one scroll owner, one page lock ([b0600c1](https://github.com/glasshome/ui/commit/b0600c1c11558fe5550f92180b4b5816d3f0a8bf))
* **dialog:** the shared Header takes media, the shared Body takes as ([2557e0f](https://github.com/glasshome/ui/commit/2557e0ff4fe67cffb480300da6792fb95d4e2d07))
* **field:** one stack, parent-owned gap, and Form* renders the Field parts ([ccc478b](https://github.com/glasshome/ui/commit/ccc478b282f96e5d638093754be6d62150e44fc7))
* **gallery:** DropdownMenu sub+checkbox, ContextMenu tone, HoverCard, data-table kit, charts ([6242849](https://github.com/glasshome/ui/commit/62428492805f969e5a620b59a6ee7962b826b867))
* **gallery:** forms catalogue shows every case this batch fixes ([aa09109](https://github.com/glasshome/ui/commit/aa09109162d995e1a8884c555a3c642a4e835c24))
* **gallery:** specimens for stat tiles, a padded card, the dock badge and a pinned tooltip ([5721860](https://github.com/glasshome/ui/commit/57218603fa9072267a888e9358e55859e976ae6f))
* **input-group:** shell owns focus and invalid through the glass knobs ([5f4c226](https://github.com/glasshome/ui/commit/5f4c22668e864593864de2fc79198f9143c4b17e))
* **lib:** named recipes for focus, control height, floating panel, pills and menus; gallery shot harness ([eed6425](https://github.com/glasshome/ui/commit/eed6425eee608cc63e0bda15f9fbf3f46bf16e3d))
* **lib:** shared segmented-item recipe for Tabs and ToggleGroup ([e46b0c0](https://github.com/glasshome/ui/commit/e46b0c07856f7153c0a04f19593cfce60ed1150c))
* **menu:** share Item/Sub/Checkbox/Radio parts between dropdown and context menus ([3108de6](https://github.com/glasshome/ui/commit/3108de6873b22711460b2e893e07280f1b17d92b))
* **motion:** morph, stagger and colour transitions; gallery walkthrough fixes ([29c6943](https://github.com/glasshome/ui/commit/29c694320ff190d8b12885682320c24763202680))
* **option-card:** sub-options are rows of the card (OptionChoice) ([fc88090](https://github.com/glasshome/ui/commit/fc880909842cf73da06e4a029e3541b76867ca9d))
* **option-card:** sub-options morph the card open; the motion pillar in SPEC ([2143ac5](https://github.com/glasshome/ui/commit/2143ac5e1697cf5aba9d3e3f75091e1c9978348f))
* **overlay:** HoverCardContent and Overlay wear FLOATING_PANEL ([85c18df](https://github.com/glasshome/ui/commit/85c18df71da3ee514a464f16110a99b9c1c944a2))
* **picker:** one field-trigger recipe, one list size and one search row in lib ([f892f2c](https://github.com/glasshome/ui/commit/f892f2cae39f09fafaaa58920f8ce5f57a0ac968))
* **pickers:** one PickerRow for area and entity rows ([c87afe7](https://github.com/glasshome/ui/commit/c87afe780572dc1df29aa9f48ab9328ccb6e19ba))
* **schema-form:** the generated form is the field stack ([9232f7b](https://github.com/glasshome/ui/commit/9232f7b7bc08c30b9ee75b0d2fe497feb06a0b59))
* **solid:** export the new DropdownMenu parts and TABLE_CELL_INSET ([3afa712](https://github.com/glasshome/ui/commit/3afa712142d6e754e343c631381f16b86b74e702))
* **table:** one head-cell recipe, gh-scroll, Button/Empty/Skeleton composed ([ac8f275](https://github.com/glasshome/ui/commit/ac8f275491f0ae57c0393162bc14889d43ac3a68))
* **table:** the flex family's head label is a token, not a p-0 override ([562c768](https://github.com/glasshome/ui/commit/562c76858c17ff6535ad73ca06d549d17925f8cf))
* **tabs:** layout=split, so a host lays the list and the panels out ([f9cc2ab](https://github.com/glasshome/ui/commit/f9cc2abe1e7fa513ac782547ad842928278b5355))
* **theme:** --radius-xs, and a size prop on Checkbox ([c987c7f](https://github.com/glasshome/ui/commit/c987c7f90dcde1d74c874a0a52b8edc8316adb5a))
* **ui:** export the thumb recipe from the package root ([3309fa2](https://github.com/glasshome/ui/commit/3309fa2c11b4d68207955b69263a25b2f74b76fc))
* **ui:** one thumb recipe and one focus ring across the toggle family ([b4bd11a](https://github.com/glasshome/ui/commit/b4bd11a3622e8f6da0c308eb4f186b53dc40ccee))


### Bug Fixes

* **bottom-sheet, field:** type only real buttons, tint only card labels ([a12a9a3](https://github.com/glasshome/ui/commit/a12a9a3ff2c64f6c6ee8990af91271fb80b5c66c))
* **charts:** restore RangeToggle's width, drop the no-op glass-rim knobs ([315b98e](https://github.com/glasshome/ui/commit/315b98e2ef131e7237e39faa90c42a49a3ac79ef))
* **ci:** kobalte 0.13.13 for the menu entry, typed tests ([ab43bbe](https://github.com/glasshome/ui/commit/ab43bbedf700efaf7dc466ccb4156936b68ca354))
* **color-slider:** clear Kobalte's track gradient inline, so one band runs edge to edge ([c6a828f](https://github.com/glasshome/ui/commit/c6a828f6f8aba16b3f31c03062feadb891c5a4f6))
* **color-wheel:** clamp the derived ring thickness to the range it lives in ([debe0ae](https://github.com/glasshome/ui/commit/debe0aeb68ea1f255500ca4c803df829816db8a2))
* **color-wheel:** size the ring from the thumb it carries ([21b1646](https://github.com/glasshome/ui/commit/21b164692d9f80fdf4eed86ac777cc658073e47d))
* **dialog:** a close button runs the bound onClick form too ([fc60eda](https://github.com/glasshome/ui/commit/fc60eda59349aa39a1af6743f26672a11844db94))
* **dialog:** a close button with text is named by its text, not by "Dismiss" ([1119df7](https://github.com/glasshome/ui/commit/1119df783d3703108d520cb2fbeee7f6e77a58f3))
* **dialog:** a registered Title names the panel, ariaLabel is only the fallback ([7d4db1b](https://github.com/glasshome/ui/commit/7d4db1b5f9c075830c65e603e640681076eb5811))
* **dialog:** align the Body content column with Header and Footer, keep pinch-zoom ([fb93b1f](https://github.com/glasshome/ui/commit/fb93b1f332e5734c082a931ff4b4b0b7e566a409))
* **dialog:** every modal family states its own role, and the sheet lock follows presence ([189adcb](https://github.com/glasshome/ui/commit/189adcb6cdec0084947dab3c73c617d8efdb7c48))
* **entity-selector:** the search input names the highlighted option; sheet search takes the touch height ([2b9be46](https://github.com/glasshome/ui/commit/2b9be4668326814c5ffe6e447d8ae4f662ca12f3))
* **form:** FormControl keeps the wrapper shape working ([055af99](https://github.com/glasshome/ui/commit/055af99581e452fc97b27a64a06fc2c60daf50f5))
* **form:** resolve a wrapped FormControl child once ([f9ac1b6](https://github.com/glasshome/ui/commit/f9ac1b685b3d473f4a752d6794c392c69ecf9e9a))
* **gallery:** a shot names its width, so a mobile run keeps the desktop one ([a4ee151](https://github.com/glasshome/ui/commit/a4ee15183dba509e8e7679ebe4c2332bcde1b11f))
* **gallery:** menu specimens wrap their items in the family's Group ([09a190b](https://github.com/glasshome/ui/commit/09a190bdd07cc52fd7ea668521dda440baa086de))
* **menu:** clip overflow, follow the highlighted item's tone, fix class merges ([250b3bf](https://github.com/glasshome/ui/commit/250b3bf58abb2d15676853c9711f29b08b5dacf6))
* **menu:** guard the muted svg color on data-tone, not an inert item class ([49ac5ab](https://github.com/glasshome/ui/commit/49ac5ab4e2e09777b960454a7059ba7d08e38e70))
* **menu:** one presentational wrapper between the menu and its rows ([de538dc](https://github.com/glasshome/ui/commit/de538dc4c841f2c17cbe16369e55f5ec5cba0631))
* **motion:** glass surfaces keep their knob transitions; stagger never scrolls ([e635e23](https://github.com/glasshome/ui/commit/e635e23ae2dac439dbe5871a728ee2d3c5945f15))
* **option-card:** flat choice rows, aligned with the title ([90066e1](https://github.com/glasshome/ui/commit/90066e1d93b696043c4f4690924fb14576e8d327))
* **option-card:** name the drawer container for the linter too ([3db703b](https://github.com/glasshome/ui/commit/3db703be41d32bf0da7d4389b41b4d4a81c15759))
* **picker:** opening a panel no longer scrolls the page to the top; inactive icon-library chips lose their glass edge ([7809dbc](https://github.com/glasshome/ui/commit/7809dbc6b4b8befbf2217ad33cbf691167807c3c))
* **pickers:** highlight a row at the row's own radius ([ce942fa](https://github.com/glasshome/ui/commit/ce942fa0d8dec6bc3ad00b7dbcec9660d5851a09))
* **popover:** carry the Kobalte parts across the surface wrapper ([a261bcc](https://github.com/glasshome/ui/commit/a261bcc8716074629c501fe77ed2c4b2b65642be))
* **schema-form:** stop a field label pointing at nothing ([0cffc62](https://github.com/glasshome/ui/commit/0cffc62bb79c23ef66e3f466f4cee0155654897b))
* **scroll-area:** deprecate ScrollBar as a no-op ([bf1765f](https://github.com/glasshome/ui/commit/bf1765ff5d39bb8c982073fd54fc46c23068cccf))
* **section-card:** no body slot without children; EmptyMedia names its kind twice ([2525fcb](https://github.com/glasshome/ui/commit/2525fcbbc20958a6e0b929b8e260cdca64692659))
* **sliding-indicator:** guard the fonts.ready continuation against post-unmount ([7985c07](https://github.com/glasshome/ui/commit/7985c07a0732069f0e273c84f879fd5ee5458a1b))
* **sliding-indicator:** observe every measured item, not just the container ([c42f772](https://github.com/glasshome/ui/commit/c42f772732e9117ecbcea0d7eba8f0c10ba881e6))
* **sonner:** one mobile breakpoint, shared with everything else ([0566427](https://github.com/glasshome/ui/commit/056642734048d4b618c4d52d87f851566b1fd3c4))
* **table:** keep TABLE_SCROLL_CLASS's default bound, type the bleed map ([8b65af8](https://github.com/glasshome/ui/commit/8b65af88f15e2f0bf800415fc33e9f3bc413c063))
* **tabs:** keep the layout union module-private, it has no consumer ([0f046cb](https://github.com/glasshome/ui/commit/0f046cb3083d8ac758c7777f9ac056001d7de363))
* **tabs:** root owns the content gap, trigger and indicator share one radius ([b46b090](https://github.com/glasshome/ui/commit/b46b09087238bac8e1f840048bb2ab9d969dbab7))
* **toggle-group:** drop the !important escape hatch, match indicator radius ([cd31df1](https://github.com/glasshome/ui/commit/cd31df19d0e4197c2d85757d036a8039c8261f0c))
* **toggle-group:** give a multi-select segment its hover back ([32e27bc](https://github.com/glasshome/ui/commit/32e27bc7ae2b83e6e2fbb472e13f87d547fe72e5))
* **toggle:** move the unpressed hover fill out of the shared variants ([9365c1a](https://github.com/glasshome/ui/commit/9365c1a5f11943db31e9e0ea3b0b42f08aad9644))
* **toggle:** outline variant wears glass instead of dead shadcn chrome ([1f666c1](https://github.com/glasshome/ui/commit/1f666c127afb4f1d4e8da09ca793fa078aa8d72d))
* **toggle:** pressed default variant's hover survives the glass takeover ([8b86a2b](https://github.com/glasshome/ui/commit/8b86a2b5355313229403cffd2bbfb3175b650e68))
* **ui:** one selection ornament, re-tap clears, indicator ignores row travel ([cc4412e](https://github.com/glasshome/ui/commit/cc4412e5070d59d4a7373d5e6b33fe892a02d7ba))
* **ui:** pin the widget tile footer, keep Kobalte's tooltip namespace, drop the static hover sheen ([381452a](https://github.com/glasshome/ui/commit/381452aceb7d2e17080c38def10a6625c198063b))

## [1.6.0](https://github.com/glasshome/ui/compare/v1.5.0...v1.6.0) (2026-08-28)


### Features

* **area-picker:** disabled mode ([da5200e](https://github.com/glasshome/ui/commit/da5200e98abba49d7effb420d9a220e857863ad8))
* **area-picker:** multi-select mode ([135fa77](https://github.com/glasshome/ui/commit/135fa77c2d917b7fba7e40c721add611434a7a46))
* **field:** FieldSubGroup, legend at the sub-heading rung, disabled dims descriptions ([9026d85](https://github.com/glasshome/ui/commit/9026d858220139fe9b0863e4c8d88636bfbc201f))
* **hero-action:** promote the setup wizard's card into the package ([7f76064](https://github.com/glasshome/ui/commit/7f76064e7b5cf5797c494d1e20025f82d33a95f2))
* **hero-option:** optional tick and an onPick that fires on re-pick ([4deb0ed](https://github.com/glasshome/ui/commit/4deb0ed6422dfdecd94a051793ce9da6ee935b46))
* **option-card:** hero size for wizard-weight pick-one screens ([9c29a23](https://github.com/glasshome/ui/commit/9c29a236029aab5829e0d8eccaf40f92b21b8004))
* **option-card:** selectable option cards over RadioGroup ([daac9ab](https://github.com/glasshome/ui/commit/daac9abfb1ddeab8c988aaf4b3ab866310102ec5))
* **step-indicator:** dots for steppers ([53dc662](https://github.com/glasshome/ui/commit/53dc6625c4c8164a17a75e521f038a5ea2175a3c))
* **switch-row:** description and disabled ([38bdde1](https://github.com/glasshome/ui/commit/38bdde1a44b4ca773fca3c20b1e4dddf0c7d9fc4))
* **switch-row:** optional leading icon ([4d04d6c](https://github.com/glasshome/ui/commit/4d04d6c1835f7d10d39dad1bc72b2c81cf47e4d2))


### Bug Fixes

* **field:** legend owns its space, sub-group stacks flush ([5a7e3d4](https://github.com/glasshome/ui/commit/5a7e3d4266a1546caf66ec5afa9025d6936c75ca))
* **input,dialog,field:** password reveal, quiet dialog scrollbars, generous field spacing ([cf69cd9](https://github.com/glasshome/ui/commit/cf69cd9b1d78f203b7273c4b39a5446b632545e1))
* **switch-row:** centre the switch when there is no description ([16f2ab1](https://github.com/glasshome/ui/commit/16f2ab1a49d2526068870a4ea0067edb32ff66b7))
* **switch:** pass aria labels through ([a03d8d5](https://github.com/glasshome/ui/commit/a03d8d5bea5097e1a81dfca0bb034aa74f89fedd))

## [1.5.0](https://github.com/glasshome/ui/compare/v1.4.0...v1.5.0) (2026-08-26)


### Features

* **image-picker:** household image gallery with upload, delete and quota copy ([be7205d](https://github.com/glasshome/ui/commit/be7205d650bd21b10200c64838c764da3b293929))
* **image-store:** host-provided image store singleton and imageUrl resolver ([26a79f5](https://github.com/glasshome/ui/commit/26a79f5a12b3e3e541b310213a565756d9935d3b))
* **media-store:** resolve a thumbnail variant for gallery tiles ([07ca3d0](https://github.com/glasshome/ui/commit/07ca3d07681f98838d4a4149bb44817cd61c3482))
* **media-tile:** promote the settings picture tile into the system ([b239c82](https://github.com/glasshome/ui/commit/b239c82853fd2921541070cfd3ebb25abd194899))
* **schema-form:** a list row previews its picture ([f32e667](https://github.com/glasshome/ui/commit/f32e66749482ffc7a172be417d281fdf24b3f36a))
* **schema-form:** render ImagePicker for the image-picker formType ([93bead5](https://github.com/glasshome/ui/commit/93bead5574e79f04f3eba859d5a24b3f401f6ebf))


### Bug Fixes

* **badge:** stop setting tier chips in all caps ([fd4699a](https://github.com/glasshome/ui/commit/fd4699ac8d28d4fca9313fb3b15ba1d44f8dea18))
* **carousel:** fade rides embla's flex track, and autoplay is reactive ([fc8021b](https://github.com/glasshome/ui/commit/fc8021b320fe0ca8ad484cdabc4360100012d69a))
* **image-picker:** add data-slot to picker trigger button ([b4ebe05](https://github.com/glasshome/ui/commit/b4ebe05b80e444441d5cafc0516bf54c084b1f6d))
* **image-picker:** let a broken tile recover when its src resolves ([c209c8b](https://github.com/glasshome/ui/commit/c209c8be09e715295194b09443d0999ffec367ac))
* **image-picker:** render a retryable failure state when the gallery index rejects ([7e8c5b6](https://github.com/glasshome/ui/commit/7e8c5b6597b551167c6a94e6abb4168090589e52))
* **image-picker:** render gallery load failure as an empty state, not an alert ([5d42123](https://github.com/glasshome/ui/commit/5d42123df65ead0656d534d6a5a5cc9879ae3fee))
* **image-picker:** resolve tiles through the store, contain store rejections ([0f7c625](https://github.com/glasshome/ui/commit/0f7c625bf83c1d7e4004ba963b59aaa4af47aa24))
* **image-picker:** server-owned quota readout via ImageStore.usage() ([1e6f716](https://github.com/glasshome/ui/commit/1e6f716de166482028d2549b1318debef2e9feca))
* **image-picker:** treat a row with no usable mime as not an image ([7189b50](https://github.com/glasshome/ui/commit/7189b50906a3d4ee5dc6e23ce0a0f19f8b2167bb))
* **image-picker:** wear a field, stay reopenable, and read empty as empty ([4da947d](https://github.com/glasshome/ui/commit/4da947db944b3794f676941a54fafe22bbd12072))
* **image-store:** add upload_failed error kind for unrecognised server errors ([33f2f67](https://github.com/glasshome/ui/commit/33f2f67f486e1f4249c9fdeb0f248192df7112b4))
* **media:** bound the picker gallery and mark an upload pending ([20b6a18](https://github.com/glasshome/ui/commit/20b6a183a0eab3e2b08b571468d35e62333f4fc7))
* **responsive-dialog:** let a close button choose its variant ([82a923d](https://github.com/glasshome/ui/commit/82a923da30ed57960290bac7ed4e525a6a59dc23))
* **schema-form:** a list item's group root drops its duplicate box and title ([d615c4b](https://github.com/glasshome/ui/commit/d615c4b7e0a97802b605c8f84539ebea282c6bb2))
* **theme:** drop the button appearance reset, it never addressed the gray box ([581d88b](https://github.com/glasshome/ui/commit/581d88b9748d6c3d18f8b52c04f0a265362e2279))
* **ui-tests:** satisfy check:types on image-picker and schema-form tests ([cf72e0f](https://github.com/glasshome/ui/commit/cf72e0f3483df2f5f2ad169600f265a5df70b4e3))

## [1.4.0](https://github.com/glasshome/ui/compare/v1.3.0...v1.4.0) (2026-08-22)


### Features

* **widget-identity:** mark widgets whose publish never completed ([e5652a0](https://github.com/glasshome/ui/commit/e5652a02f5731ddf9810a4891c6cf78becaef7fa))


### Bug Fixes

* **dock:** clear the overflow timers on cleanup ([b3b99a7](https://github.com/glasshome/ui/commit/b3b99a73cf0ad0c27c629104a30e54eac3cf561d))
* **theme:** reset button appearance so old WebViews stop native-painting raw buttons ([67e480e](https://github.com/glasshome/ui/commit/67e480e9e37f9d2fedc14c901e6f49139c616391))

## [1.3.0](https://github.com/glasshome/ui/compare/v1.2.0...v1.3.0) (2026-08-08)


### Features

* **glass:** add a --glass-sheen knob for the sheen ellipse size ([9506d7c](https://github.com/glasshome/ui/commit/9506d7cfc94fce7c416d3c0fa615a08cca48b702))


### Bug Fixes

* **alert-dialog:** make variant and size optional on AlertDialogAction ([c1c26be](https://github.com/glasshome/ui/commit/c1c26be722c417fd55fbdabe2f538fce9a484f32))
* **alert:** colour AlertTitle by the tone its parent resolved ([26d4e63](https://github.com/glasshome/ui/commit/26d4e632ded79ae9c62f8323b6e4f2470ad1d74d))
* **overlay:** blur behind the translucent overlay fill ([506c5be](https://github.com/glasshome/ui/commit/506c5be2cdb84334a154692c19b3ecff86af955e))
* **sheet:** float the side panel and match the dialog's chrome ([b64125c](https://github.com/glasshome/ui/commit/b64125cc19336bc8b266f03f877f2873572046e9))

## [1.2.0](https://github.com/glasshome/ui/compare/v1.1.2...v1.2.0) (2026-08-04)


### Features

* **alert-dialog:** variant prop on AlertDialogAction ([e45fc0a](https://github.com/glasshome/ui/commit/e45fc0aee027a3ae25cc5308337f217633d5dfbc))
* class-passthrough gate and structural-class lint ([f2c855f](https://github.com/glasshome/ui/commit/f2c855f6243d6a7cd6900a79d4d37cf01ff7e202))
* **schema-form:** controlled recursive form with list and variants fields ([38728fd](https://github.com/glasshome/ui/commit/38728fd49cb559c40c34c2e8504f037b829e72e7))
* **schema-form:** interaction polish and reusable list drag-reorder ([6e3a975](https://github.com/glasshome/ui/commit/6e3a975ce36ecd579f3b16a97eb72df45d42027b))
* **section-card:** merge caller classes via cn, add subtitleClass ([b276b07](https://github.com/glasshome/ui/commit/b276b07a2e9620f7f1f8b0ec911a8bb2db5e07ca))
* **slider:** thumbColors, fillTone, markers, minStepsBetweenThumbs ([577ed42](https://github.com/glasshome/ui/commit/577ed429026594f19d82377219a282ee6c37a00d))


### Bug Fixes

* **build:** keep type declarations during watch builds ([07f9abd](https://github.com/glasshome/ui/commit/07f9abdacc326b9c103898ebdf39fd08e9a8588f))
* make the light theme legible, and stop an off switch reading as on ([5f8f071](https://github.com/glasshome/ui/commit/5f8f0712b35d560a92b017b1b89285ee63c399d3))
* **schema-form:** clear drop transforms without transition ([6168d58](https://github.com/glasshome/ui/commit/6168d585ae6807553a312d515e68d81fa236f833))

## [1.1.2](https://github.com/glasshome/ui/compare/v1.1.1...v1.1.2) (2026-07-29)


### Bug Fixes

* **astro:** accept the attributes every component already spreads ([75b5bf6](https://github.com/glasshome/ui/commit/75b5bf690c80f85f35647312aa3f193e1148dbc7))

## [1.1.1](https://github.com/glasshome/ui/compare/v1.1.0...v1.1.1) (2026-07-29)


### Bug Fixes

* **carousel:** let the Astro twin accept the div attributes it spreads ([f61f626](https://github.com/glasshome/ui/commit/f61f6267395c6ca72f47cafffe17fbb5d3226008))

## [1.1.0](https://github.com/glasshome/ui/compare/v1.0.1...v1.1.0) (2026-07-29)


### Features

* **carousel:** add a server-rendered Astro twin ([7b0010c](https://github.com/glasshome/ui/commit/7b0010cb645493f815b58595a978cdd5b5bb3cd7))
* **carousel:** add fade and wipe transitions, autoplay, and dots ([e0d917b](https://github.com/glasshome/ui/commit/e0d917bd28cba356b6f5fd8876937ad8affc7bd5))
* **icon-picker:** own the icon picker, and dispatch SchemaForm on formType ([273a533](https://github.com/glasshome/ui/commit/273a533683f56cf87e62a71e5014bb883399efe9))
* **theme:** add a motion scale with reduced-motion built in ([e687f83](https://github.com/glasshome/ui/commit/e687f83e17fdd166359c50cb565a7f678d8b031b))


### Bug Fixes

* **carousel:** give the dots forEach a statement body ([4d68b08](https://github.com/glasshome/ui/commit/4d68b08e4c9941e12aa139663c912af1d4d79313))
* **carousel:** make the wipe transition actually read ([d820a2e](https://github.com/glasshome/ui/commit/d820a2eb9b62f121e4285d18fe4810d949195180))
* **entity-selector:** name the real filter when a device-class empties the list ([e366242](https://github.com/glasshome/ui/commit/e366242b901d7e55dd4a4d135f1a9794378510a5))
* **glass:** publish a descendant-readable tone ([fb6c98f](https://github.com/glasshome/ui/commit/fb6c98f9d37c3e9b7a0e130459f8415c22e685d0))
* lock the carousel autoplay and fade deps ([73f0668](https://github.com/glasshome/ui/commit/73f06688bd5da69d7602fb7586fc55c492c80a99))
* **section-card:** accept a class passthrough ([d21c1b5](https://github.com/glasshome/ui/commit/d21c1b5bf6244b1e2ecc9e3172b3fcdde8e1122c))

## 1.0.1 (2026-07-21)

### Fixed

- npm tarball now includes `src/lib/`: the `./astro/*` components import
  shared class recipes from `../lib/*`, which the 1.0.0 package left out
  (fine under a link: symlink, unresolvable from npm).

## 1.0.0 (2026-07-21)

First stable release. The API surface is frozen: removals or reroutes from
here on are semver majors.

### Breaking

- Removed Sidebar, Command, Calendar, Menubar and NavigationMenu (no known
  call sites; re-adding later is a minor).
- Dropped the `@glasshome/sync-layer` peer dependency. EntitySelector and
  AreaPicker read entity/area data through the new `EntityDataAdapter`:
  hosts call `provideEntityData(adapter)` at startup (or wrap a tree in
  `EntityDataContext.Provider`). The `isDemoMode`/`loadDemoData`/
  `unloadDemoData` re-exports are gone.
- Icons are iconify-only: every lucide-solid usage migrated to
  `@iconify-icon/solid` and the lucide-solid dependency is removed. Spinner
  now takes iconify Icon props instead of svg props.
- `tailwindcss` and `tw-animate-css` moved from dependencies to
  peerDependencies (they are build tools, resolved by the consumer's own
  build). `astro` declared as an optional peer for the `./astro/*` entries.
- Removed unused exports: `AlertDialogOverlay`, `AlertDialogPortal`,
  `SECTION_ROW_SURFACE`, bottom-sheet `TRANSITION_CSS`, `SheetState`,
  `SwitchProps`, WidgetCard default export. Legacy top-level `main`/`types`
  package fields removed (the `exports` map is the interface).

### Added

- `EntityDataAdapter` / `EntityDataContext` / `provideEntityData` /
  `useEntityData` plus the structural `EntityViewLike` / `AreaViewLike`
  view types.
- `@source "../../dist"` in the shipped stylesheet, so npm consumers'
  Tailwind builds see component class names without hand-pointed
  node_modules paths.
- Committed `bun.lock`; CI and publishes install with `--frozen-lockfile`.
- Release automation: release-please manages versions and GitHub releases
  from semantic commits; npm publishes use trusted publishing (OIDC).
- Glass frost slot (`--glass-frost`, `--glass-frost-size`,
  `--glass-frost-pos`): hosts can composite a pre-blurred backdrop under
  the glass formula's own material (fixes performant-blur mode losing the
  glass material).

### Fixed

- Type declarations now resolve under Node 16+ module resolution: all relative imports in emitted `.d.ts` files carry explicit `.js` extensions (previously only bundler resolution worked).
- `tokens/presets.ts` re-synced with `theme.css` after oklch value normalization (`--muted-foreground`).

### Added

- Test suite (vitest + happy-dom + @solidjs/testing-library): unit tests for the BottomSheet state machine, velocity tracker, and drag/scroll arbitration; token model tests (oklch parsing, theme derivation, hex gamut mapping, preset contract); render smoke tests for the core primitives.
- `check:types` (typechecks src + tests) and `check:publish` (publint + arethetypeswrong) scripts; both run in CI and gate npm publishes alongside lint, token sync, and tests.

### Changed

- Node engine requirement raised to `>=20`.
- README rewritten around the actual entry points (`/solid`, `/tokens`, `/astro/*`, `/styles`) and current component inventory.
