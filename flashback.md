# Flashback: a web app for note-taking

## Features

- Tap a record button to capture the previous 15 seconds of audio. (The app should record an audio stream behind the scenes to enable this.)
- The audio recording, the result of tapping the "record" button repeatedly, should be saved locally on the user's device. The user sees a transcript of speech while the audio plays.
- A "browse" feature lets you play, name or delete previous recordings. A "favorite" feature lets you "heart" a recording to mark it as important.

## Design

Minimal design with clean, light, bright colors. Inspired by Instagram.

The app is designed for mobile browsers, but it's responsive for Desktop.

## Tech Stack

Prefer using APIs that do NOT make network requests. Use browser APIs for storage, audio recording, and audio transcription.

The app must use APIs compatible with the Firefox mobile browser.

## Testing

Create Jest tests to cover each key feature in the app. Run the tests and make updates if necessary until they pass.

## Security

Audio recordings can be optionally encrypted using a browser-based encryption API and unlocked with a password. The encryption is completely optional.