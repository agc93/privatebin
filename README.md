# PrivateBin Upload Library

This library is a super-simple helper to upload content to a PrivateBin server. There's already [an excellent CLI available](https://www.npmjs.com/package/@pixelfactory/privatebin) so this is specifically intended for use in projects that want to include PrivateBin uploads.

> Note that this library only supports PrivateBin 1.3+ (aka format version 2)

## Usage

In short, create a new `PrivateBinClient` and call `uploadContent` with your content and provide any options you want (sane-ish defaults will be used for any missing options):

```typescript
import {PrivateBinClient} from '@agc93/privatebin'
//...
var client = new PrivateBinClient("https://privatebin.net/");
var result = await client.uploadContent('This is a test for `some` **content**', {uploadFormat: 'markdown', expiry: '5min'});
console.log(JSON.stringify(result));
return result;
```

There's also a `getPasteUrl` method included for convenience if you're just after the final shareable link

```typescript
import {getPasteUrl} from '@agc93/privatebin';
//...
console.log(getPasteUrl(resultFromClient));
```

> **Important**: The `PrivateBinClient` defaults to creating expiring pastes! If you want to create permanent pastes, make sure to set the `expiry` to `never`


## Changelog

- 0.0.1: Initial release
- 0.0.2: Add compat for Node 12.9+
- 0.0.3: Bump dependencies