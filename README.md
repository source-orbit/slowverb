# Slowverb

### Apply a "Slowed & Reverb" filter directly on spotify songs - only works on spotify for web (open.spotify.com)

### Version 1.0
Install here: (pending review from google chrome)

---

## Install from github..

-   download project as zip ![preview img](https://i.stack.imgur.com/PrvYK.png)
-   unzip and load the folder as [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked)
-   remember to click that little refresh button on the extension page for the extension if you make code changes.

---

## Acknowledgements

#### spotitySpeedExtension

- @intOrfloat (original author): https://github.com/intOrfloat/spotitySpeedExtension
    
- @jamesEmerson112 (added manifest V3 support): https://github.com/jamesEmerson112/spotitySpeedExtension

Thanks to them for the original codebase and method of injecting the script into the page. Some original code was used as a base for this project, but it has been heavily modified and restructured. Some of their comments are still present in the code.

Both were under Unlicense, therefore, this extension is under the same license.

-   Changes made from the original codebase:

    -   Full rewrite and restructure of the codebase
        -   Still maintained the original vanilla js + non-modular codebase for simplicity
        -   Did not think it was worthwhile switching to Typescript or React for this project
    -   Added reverb and reverb presets
    -   Added pitch correction when changing playback speed
    -   Added new interface to change playback speed and reverb
    -   Improved security by deleting variables from the window/document as
        soon as they were used

-   This product attempts to apply a "Slowed & Reverb" filter directly on spotify songs,
    which involves changes to the pitch and a lot of audio processing. The original speed extension only changed the playback speed.

#### Dattorro Reverb
- Reverb would not be possible without @khoin's dattorroReverb audio worklet module:
https://github.com/khoin/DattorroReverbNode
- Some presets were adapted from the same repo and referenced in the code
