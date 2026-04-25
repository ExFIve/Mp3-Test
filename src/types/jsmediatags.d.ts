declare module "jsmediatags" {
  interface ReadTagResult {
    tags: Record<string, unknown>;
  }

  interface ReaderOptions {
    onSuccess: (result: ReadTagResult) => void;
    onError: (error: unknown) => void;
  }

  interface JsMediaTags {
    read: (file: File, options: ReaderOptions) => void;
  }

  const jsmediatags: JsMediaTags;
  export default jsmediatags;
}
