import fs from 'node:fs';
import mime from 'mime-types';
import type { GenericNode, GenericParent } from 'myst-common';
import { RuleId, plural } from 'myst-common';
import { computeHash, hashAndCopyStaticFile, isUrl } from 'myst-cli-utils';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import path from 'node:path';
import type { VFileMessage } from 'vfile-message';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { Image } from 'myst-spec-ext';
import { extFromMimeType } from 'nbtx';
import type { ISession } from '../session/types.js';
import { castSession } from '../session/cache.js';
import { watch } from '../store/index.js';
import { EXT_REQUEST_HEADERS } from '../utils/headers.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import {
  ImageExtensions,
  KNOWN_IMAGE_EXTENSIONS,
  KNOWN_VIDEO_EXTENSIONS,
} from '../utils/resolveExtension.js';
import { ffmpeg, imagemagick, inkscape } from '../utils/index.js';

export const BASE64_HEADER_SPLIT = ';base64,';

function isBase64(data: string) {
  return data.split(BASE64_HEADER_SPLIT).length === 2;
}

function getGithubRawUrl(url?: string): string | undefined {
  const GITHUB_BLOB = /^(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)\/blob\//;
  if (!url?.match(GITHUB_BLOB)) return undefined;
  return url.replace(GITHUB_BLOB, 'https://raw.githubusercontent.com/$1/$2/');
}

/**
 * Write a base64 encoded image to a file.
 *
 * @param session: ISession - the session with logging
 * @param writeFolder: string - the folder
 * @param data: string - the base64 encoded image data
 * @param contentType: string | undefined - the mime type of the data, which if supplied will be used as fallback
 * @returns
 */
async function writeBase64(
  session: ISession,
  writeFolder: string,
  data: string,
  contentType?: string,
) {
  const [justData, header] = data.split(BASE64_HEADER_SPLIT).reverse(); // reverse as sometimes there is no header
  const ext = extFromMimeType(header?.replace('data:', '') ?? contentType);
  const hash = computeHash(justData);
  const file = `${hash}${ext}`;
  const filePath = path.join(writeFolder, file);
  session.log.debug(`Writing binary output file ${justData.length} bytes to ${filePath}`);
  if (!fs.existsSync(writeFolder)) fs.mkdirSync(writeFolder, { recursive: true });
  fs.writeFileSync(filePath, justData, {
    encoding: 'base64',
  });
  return file;
}

export async function downloadAndSaveImage(
  session: ISession,
  url: string,
  file: string,
  fileFolder: string,
): Promise<string | undefined> {
  const exists = fs.existsSync(fileFolder);
  const fileMatch = exists && fs.readdirSync(fileFolder).find((f) => path.parse(f).name === file);
  if (exists && fileMatch) {
    session.log.debug(`Cached image found for: ${url}...`);
    return fileMatch;
  }
  const filePath = path.join(fileFolder, file);
  session.log.debug(`Fetching image: ${url}...\n  -> saving to: ${filePath}`);
  try {
    const github = getGithubRawUrl(url);
    const res = await session.fetch(github ?? url, { headers: EXT_REQUEST_HEADERS });
    const contentType = res.headers.get('content-type') || '';
    const extension = mime.extension(contentType);
    if (!extension || !contentType) throw new Error('No content-type for image found.');
    if (!contentType.startsWith('image/')) {
      throw new Error(`ContentType "${contentType}" is not an image`);
    }
    if (!fs.existsSync(fileFolder)) fs.mkdirSync(fileFolder, { recursive: true });
    // Write to a file
    const fileStream = fs.createWriteStream(`${filePath}.${extension}`);
    await new Promise((resolve, reject) => {
      if (!res.body) {
        reject(`no response body from ${url}`);
      } else {
        res.body.pipe(fileStream);
        res.body.on('error', reject);
        fileStream.on('finish', resolve);
      }
    });
    await new Promise((r) => setTimeout(r, 50));
    const fileName = `${file}.${extension}`;
    session.log.debug(`Image successfully saved to: ${fileName}`);
    return fileName;
  } catch (error) {
    session.log.debug(`\n\n${(error as Error).stack}\n\n`);
    addWarningForFile(
      session,
      file,
      `Error saving image "${url}": ${(error as Error).message}`,
      'error',
      { ruleId: RuleId.imageDownloads },
    );
    return undefined;
  }
}

export function resolveOutputPath(file: string, writeFolder: string, altOutputFolder?: string) {
  if (altOutputFolder == null) {
    return path.join(writeFolder, file);
  }
  // If the altOutputFolder ends with "/" it is assumed to be a web path, so normal path
  // separator is ignored.
  if (altOutputFolder.endsWith('/')) {
    return `${altOutputFolder}${file}`;
  }
  return path.join(altOutputFolder, file);
}

export async function saveImageInStaticFolder(
  session: ISession,
  urlSource: string,
  sourceFile: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string; position?: VFileMessage['position'] },
): Promise<{ urlSource: string; url: string } | null> {
  const sourceFileFolder = path.dirname(sourceFile);
  const imageLocalFile = path.join(sourceFileFolder, urlSource);
  let file: string | undefined;
  if (isUrl(urlSource)) {
    // If not oxa, download the URL directly and save it to a file with a hashed name
    file = await downloadAndSaveImage(session, urlSource, computeHash(urlSource), writeFolder);
  } else if (fs.existsSync(imageLocalFile)) {
    // Non-oxa, non-url local image paths relative to the config.section.path
    if (path.resolve(path.dirname(imageLocalFile)) === path.resolve(writeFolder)) {
      // If file is already in write folder, don't hash/copy
      file = path.basename(imageLocalFile);
    } else {
      file = hashAndCopyStaticFile(session, imageLocalFile, writeFolder, (m: string) => {
        addWarningForFile(session, sourceFile, m, 'error', { ruleId: RuleId.imageCopied });
      });
    }
    if (!file) return null;
  } else if (isBase64(urlSource)) {
    // Handle inline base64 images
    file = await writeBase64(session, writeFolder, urlSource);
  } else {
    const message = `Cannot find image "${urlSource}" in ${sourceFileFolder}`;
    addWarningForFile(session, sourceFile, message, 'error', {
      position: opts?.position,
      ruleId: RuleId.imageExists,
    });
    return null;
  }
  // Update mdast with new file name
  const url = resolveOutputPath(file as string, writeFolder, opts?.altOutputFolder);
  return { urlSource, url };
}

export function transformImagesToEmbed(mdast: GenericParent) {
  const images = selectAll('image', mdast) as GenericNode[];
  images.forEach((image) => {
    // If image URL starts with #, replace this node with embed node
    if (image.url.startsWith('xref:') || image.url.startsWith('#')) {
      image.type = 'embed';
      image.source = { label: image.url.startsWith('xref:') ? image.url : image.url.substring(1) };
      image['remove-input'] = image['remove-input'] ?? true;
      delete image.url;
      return;
    }
  });
}

export function transformImagesWithoutExt(
  session: ISession,
  mdast: GenericParent,
  file: string,
  opts?: { imageExtensions?: ImageExtensions[] },
) {
  const images = selectAll('image', mdast) as GenericNode[];
  images.forEach((image) => {
    // Look up the image paths by known extensions if it is not provided
    // This also handles wildcard extensions, e.g. 'example.*'
    const wildcardRegex = /\.\*$/;
    const imagePath = path.join(path.dirname(file), image.url).replace(wildcardRegex, '');
    if (!fs.existsSync(imagePath)) {
      const sortedExtensions = [
        // Valid extensions
        ...(opts?.imageExtensions ?? []),
        // Convertable extensions
        ...Object.keys(conversionFnLookup),
        // All known extensions
        ...KNOWN_IMAGE_EXTENSIONS,
      ];
      const extension = sortedExtensions.find((ext) => fs.existsSync(imagePath + ext));
      if (extension) {
        const replacement = image.url.replace(wildcardRegex, '') + extension;
        session.log.debug(`Resolving ${image.url} to ${replacement}`);
        image.url = replacement;
        image.urlSource = image.url;
      }
    }
  });
}

export async function transformImagesToDisk(
  session: ISession,
  mdast: GenericParent,
  file: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string; imageExtensions?: ImageExtensions[] },
) {
  const images = selectAll('image', mdast) as GenericNode[];
  await Promise.all(
    images.map(async (image) => {
      const result = await saveImageInStaticFolder(
        session,
        image.urlSource || image.url,
        file,
        writeFolder,
        {
          altOutputFolder: opts?.altOutputFolder,
          position: image.position,
        },
      );
      if (result) {
        // Update mdast with new file name
        const { urlSource, url } = result;
        image.urlSource = urlSource;
        image.url = url;
      }
    }),
  );
}

const DEFAULT_IMAGE_EXTENSIONS = [ImageExtensions.png, ImageExtensions.jpg, ImageExtensions.jpeg];

type ConversionOpts = {
  file: string;
  inkscapeAvailable: boolean;
  imagemagickAvailable: boolean;
  dwebpAvailable: boolean;
  ffmpegAvailable: boolean;
};

type ConversionFn = (
  session: ISession,
  source: string,
  writeFolder: string,
  conversionOpts: ConversionOpts,
) => Promise<string | null>;

/**
 * Factory function for all simple imagemagick conversions
 */
function imagemagickConvert(
  from: ImageExtensions,
  to: ImageExtensions,
  options?: { trim?: boolean },
) {
  return async (session: ISession, source: string, writeFolder: string, opts: ConversionOpts) => {
    const { imagemagickAvailable } = opts;
    if (imagemagickAvailable) {
      return imagemagick.convert(from, to, session, source, writeFolder, options);
    }
    return null;
  };
}

/**
 * Factory function for all simple ffmpeg conversions
 */
function ffmpegConvert(from: ImageExtensions, to: ImageExtensions) {
  return async (session: ISession, source: string, writeFolder: string, opts: ConversionOpts) => {
    const { ffmpegAvailable } = opts;
    if (ffmpegAvailable) {
      return ffmpeg.convert(from, to, session, source, writeFolder);
    }
    return null;
  };
}

/**
 * svg -> pdf using inkscape
 */
async function svgToPdf(
  session: ISession,
  source: string,
  writeFolder: string,
  opts: ConversionOpts,
) {
  const { file, inkscapeAvailable, imagemagickAvailable } = opts;
  if (inkscapeAvailable) {
    return inkscape.convert(ImageExtensions.svg, ImageExtensions.pdf, session, source, writeFolder);
  } else if (imagemagickAvailable) {
    addWarningForFile(
      session,
      file,
      'To convert .svg images to .pdf, you must install inkscape.',
      'warn',
      {
        note: 'Images converted to .png as a fallback using imagemagick.',
        ruleId: RuleId.imageFormatConverts,
      },
    );
  }
  return null;
}

/**
 * svg -> png using inkscape or imagemagick
 */
async function svgToPng(
  session: ISession,
  source: string,
  writeFolder: string,
  opts: ConversionOpts,
) {
  const { inkscapeAvailable } = opts;
  if (inkscapeAvailable) {
    return inkscape.convert(ImageExtensions.svg, ImageExtensions.png, session, source, writeFolder);
  }
  return imagemagickConvert(ImageExtensions.svg, ImageExtensions.png)(
    session,
    source,
    writeFolder,
    opts,
  );
}

/**
 * gif -> png using imagemagick
 */
async function gifToPng(
  session: ISession,
  source: string,
  writeFolder: string,
  opts: ConversionOpts,
) {
  const { imagemagickAvailable } = opts;
  if (imagemagickAvailable) {
    return imagemagick.extractFirstFrameOfGif(session, source, writeFolder);
  }
  return null;
}

/**
 * webp -> png using dwebp
 */
async function webpToPng(
  session: ISession,
  source: string,
  writeFolder: string,
  opts: ConversionOpts,
) {
  const { dwebpAvailable } = opts;
  if (dwebpAvailable) {
    return imagemagick.convertWebpToPng(session, source, writeFolder);
  }
  return null;
}

/**
 * These are all the available image conversion functions
 *
 * Get the function to convert from one extension to another with
 * conversionFnLookup[from][to]
 */
const conversionFnLookup: Record<string, Record<string, ConversionFn>> = {
  [ImageExtensions.svg]: {
    [ImageExtensions.pdf]: svgToPdf,
    [ImageExtensions.png]: svgToPng,
  },
  [ImageExtensions.pdf]: {
    [ImageExtensions.png]: imagemagickConvert(ImageExtensions.pdf, ImageExtensions.png, {
      trim: true,
    }),
  },
  [ImageExtensions.gif]: {
    [ImageExtensions.png]: gifToPng,
  },
  [ImageExtensions.webp]: {
    [ImageExtensions.png]: webpToPng,
  },
  [ImageExtensions.eps]: {
    // Currently the inkscape CLI has a bug which prevents EPS conversions;
    // once that is fixed, we may uncomment the rest of this section to
    // enable better conversions, e.g. EPS -> SVG
    // https://gitlab.com/inkscape/inkscape/-/issues/3524
    [ImageExtensions.png]: imagemagickConvert(ImageExtensions.eps, ImageExtensions.png),
  },
  [ImageExtensions.tiff]: {
    [ImageExtensions.png]: imagemagickConvert(ImageExtensions.tiff, ImageExtensions.png),
  },
  [ImageExtensions.tif]: {
    [ImageExtensions.png]: imagemagickConvert(ImageExtensions.tif, ImageExtensions.png),
  },
  [ImageExtensions.mov]: {
    [ImageExtensions.mp4]: ffmpegConvert(ImageExtensions.mov, ImageExtensions.mp4),
  },
  [ImageExtensions.avi]: {
    [ImageExtensions.mp4]: ffmpegConvert(ImageExtensions.avi, ImageExtensions.mp4),
  },
};

/**
 * Returns a list of all available conversion functions from the input extension to valid extensions
 *
 * If multiple functions are available, they are ordered based on the order of validExts.
 * Therefore validExts should have preferred formats first.
 */
export function getConversionFns(imageExt: string, validExts: ImageExtensions[]): ConversionFn[] {
  if (!conversionFnLookup[imageExt]) return [];
  const conversionFns: ConversionFn[] = [];
  validExts.forEach((validExt) => {
    const conversionFn = conversionFnLookup[imageExt][validExt];
    if (conversionFn) conversionFns.push(conversionFn);
  });
  return conversionFns;
}

/**
 * Transform to convert all images with known-but-unsupported extensions to supported extensions
 *
 * The `imageExtensions` option is a list of supported extensions, ordered by preference.
 * For example you may use `imageExtensions = ['.svg', '.png']` so the vector svg
 * format is preferred but fallback png is allowed.
 *
 * If an image extension is unknown or if there are no functions to covnert it to
 * a valid extension, the image will remain unchanged.
 */
export async function transformImageFormats(
  session: ISession,
  mdast: GenericParent,
  file: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string; imageExtensions?: ImageExtensions[] },
) {
  const images = selectAll('image', mdast) as GenericNode[];
  // Ignore all images with supported extension types
  const validExts = opts?.imageExtensions ?? DEFAULT_IMAGE_EXTENSIONS;

  // Build a lookup of {[extension]: [list of images]} for extensions not in validExts
  const invalidImages: Record<string, GenericNode[]> = {};
  images.forEach((image) => {
    const ext = path.extname(image.url).toLowerCase();
    if (validExts.includes(ext as ImageExtensions)) return;
    if (invalidImages[ext]) {
      invalidImages[ext].push(image);
    } else {
      invalidImages[ext] = [image];
    }
  });
  if (Object.keys(invalidImages).length === 0) return;

  const inkscapeAvailable = inkscape.isInkscapeAvailable();
  const imagemagickAvailable = imagemagick.isImageMagickAvailable();
  const dwebpAvailable = imagemagick.isDwebpAvailable();
  const ffmpegAvailable = ffmpeg.isFfmpegAvailable();

  /**
   * convert runs the input conversion functions on the image
   *
   * These functions are run in order until one succeeds or they all fail.
   * On success, the image node is updated with the new converted image path.
   * On failure, an error is reported.
   */
  const convert = async (image: GenericNode, conversionFns: ConversionFn[]) => {
    const inputFile = path.join(writeFolder, path.basename(image.url));
    let outputFile: string | null = null;
    for (const conversionFn of conversionFns) {
      if (!outputFile) {
        outputFile = await conversionFn(session, inputFile, writeFolder, {
          file,
          inkscapeAvailable,
          imagemagickAvailable,
          dwebpAvailable,
          ffmpegAvailable,
        });
      }
    }
    if (outputFile) {
      // Update mdast with new file name
      image.url = resolveOutputPath(outputFile, writeFolder, opts?.altOutputFolder);
      session.log.debug(`Successfully converted ${inputFile} -> ${image.url}`);
    } else {
      session.log.debug(`Failed to convert ${inputFile}`);
      addWarningForFile(
        session,
        file,
        `To convert image "${path.basename(image.url)}" you must install imagemagick.`,
        'error',
        {
          note: `Image ${path.basename(image.url)} may not render correctly`,
          position: image.position,
          ruleId: RuleId.imageFormatConverts,
        },
      );
    }
  };

  // Collect and flatten all image nodes with their corresponding conversion function
  const conversionPromises: Promise<void>[] = [];
  const conversionExts: string[] = [];
  const unconvertableImages: GenericNode[] = [];
  Object.entries(invalidImages).forEach(([ext, imageNodes]) => {
    const conversionFns = getConversionFns(ext, validExts);
    if (!conversionFns.length) {
      unconvertableImages.push(...imageNodes);
      return;
    }
    conversionExts.push(ext);
    imageNodes.forEach((node) => {
      conversionPromises.push(convert(node, conversionFns));
    });
  });
  if (conversionPromises.length) {
    session.log.info(
      `🌠 Converting ${plural(
        '%s image(s) with extension(s)',
        conversionPromises,
      )} ${conversionExts.join(', ')} to supported ${plural(
        'format(s)',
        validExts,
      )} ${validExts.join(', ')}`,
    );
  }
  unconvertableImages.forEach((image) => {
    const badExt = path.extname(image.url) || '<no extension>';
    addWarningForFile(
      session,
      file,
      `Unsupported image extension "${badExt}" may not correctly render.`,
      'error',
      { position: image.position, ruleId: RuleId.imageFormatConverts },
    );
  });

  // Run the conversions!
  return Promise.all(conversionPromises);
}

export async function transformThumbnail(
  session: ISession,
  mdast: GenericParent | null,
  file: string,
  frontmatter: PageFrontmatter,
  writeFolder: string,
  opts?: { altOutputFolder?: string; webp?: boolean; maxSizeWebp?: number },
): Promise<{ url: string; urlOptimized?: string } | undefined> {
  let thumbnail = frontmatter.thumbnail;
  // If the thumbnail is explicitly null, don't add an image
  if (thumbnail === null) {
    session.log.debug(`${file}#frontmatter.thumbnail is explicitly null, not searching content.`);
    return;
  }
  if (!thumbnail && mdast) {
    // The thumbnail isn't found, grab it from the mdast, excluding videos
    const [image] = (selectAll('image', mdast) as Image[]).filter((n) => {
      return !KNOWN_VIDEO_EXTENSIONS.find((ext) => n.url.endsWith(ext));
    });
    if (!image) {
      session.log.debug(`${file}#frontmatter.thumbnail is not set, and there are no images.`);
      return;
    }
    session.log.debug(`${file}#frontmatter.thumbnail is being populated by the first image.`);
    thumbnail = image.urlSource || image.url;
  }
  if (!thumbnail) return;
  session.log.debug(`${file}#frontmatter.thumbnail Saving thumbnail in static folder.`);
  const result = await saveImageInStaticFolder(session, thumbnail, file, writeFolder, {
    altOutputFolder: opts?.altOutputFolder,
  });
  if (!result) return;
  // Update frontmatter with new file name
  const { url } = result;
  frontmatter.thumbnail = url;
  const fileMatch = path.basename(result.url);
  if (opts?.webp) {
    const optimized = await imagemagick.convertImageToWebp(
      session,
      path.join(writeFolder, fileMatch),
      { maxSize: opts.maxSizeWebp },
    );
    if (optimized) {
      const urlOptimized = url.replace(fileMatch, optimized);
      frontmatter.thumbnailOptimized = urlOptimized;
      return { url, urlOptimized };
    }
  }
  return { url };
}

export async function transformBanner(
  session: ISession,
  file: string,
  frontmatter: { banner?: string | null; bannerOptimized?: string },
  writeFolder: string,
  opts?: { altOutputFolder?: string; webp?: boolean; maxSizeWebp?: number },
): Promise<{ url: string; urlOptimized?: string } | undefined> {
  const banner = frontmatter.banner;
  // If the thumbnail is explicitly null, don't add an image
  if (banner === null || !banner) {
    session.log.debug(`${file}#frontmatter.banner is explicitly null, not searching content.`);
    return;
  }
  session.log.debug(`${file}#frontmatter.banner Saving banner in static folder.`);
  const result = await saveImageInStaticFolder(session, banner, file, writeFolder, {
    altOutputFolder: opts?.altOutputFolder,
  });
  if (!result) return;
  // Update frontmatter with new file name
  const { url } = result;
  frontmatter.banner = url;
  const fileMatch = path.basename(result.url);
  if (opts?.webp) {
    const optimized = await imagemagick.convertImageToWebp(
      session,
      path.join(writeFolder, fileMatch),
      { maxSize: opts.maxSizeWebp },
    );
    if (optimized) {
      const urlOptimized = url.replace(fileMatch, optimized);
      frontmatter.bannerOptimized = urlOptimized;
      return { url, urlOptimized };
    }
  }
  return { url };
}

export async function transformWebp(
  session: ISession,
  opts: { file: string; imageWriteFolder: string; maxSizeWebp?: number },
) {
  const { file, imageWriteFolder } = opts;
  const cache = castSession(session);
  const postData = cache.$getMdast(opts.file)?.post;
  if (!postData) throw new Error(`Expected mdast to be processed and transformed for ${file}`);
  if (!fs.existsSync(imageWriteFolder)) return; // No images exist to copy - not necessarily an error
  const writeFolderContents = fs.readdirSync(imageWriteFolder);
  const { mdast, frontmatter } = postData;
  const images = selectAll('image', mdast) as Image[];
  await Promise.all(
    images.map(async (image) => {
      if (!image.url) return;
      const fileMatch = writeFolderContents.find((item) => image.url.endsWith(item));
      if (!fileMatch) return;
      try {
        const result = await imagemagick.convertImageToWebp(
          session,
          path.join(imageWriteFolder, fileMatch),
          { maxSize: opts.maxSizeWebp },
        );
        if (result) image.urlOptimized = image.url.replace(fileMatch, result);
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
    }),
  );

  await Promise.all(
    (['thumbnail', 'banner'] as const).map(async (attr) => {
      const attrOptimized = `${attr}Optimized` as 'thumbnailOptimized' | 'bannerOptimized';
      if (frontmatter[attr]) {
        const fileMatch = writeFolderContents.find((item) => frontmatter[attr]?.endsWith(item));
        if (fileMatch) {
          try {
            const result = await imagemagick.convertImageToWebp(
              session,
              path.join(imageWriteFolder, fileMatch),
              { maxSize: opts.maxSizeWebp },
            );
            if (result) {
              frontmatter[attrOptimized] = frontmatter[attr]?.replace(fileMatch, result);
              session.store.dispatch(
                watch.actions.updateFileInfo({
                  path: file,
                  [attrOptimized]: frontmatter[attrOptimized],
                }),
              );
            }
          } catch (error) {
            session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
          }
        }
      }
    }),
  );
  const cachedMdast = cache.$getMdast(file);
  if (cachedMdast) cachedMdast.post = { ...postData, mdast, frontmatter };
}

function isValidImageNode(node: GenericNode, validExts: ImageExtensions[]) {
  return (
    node.type === 'image' &&
    node.url &&
    validExts.includes(path.extname(node.url).toLowerCase() as ImageExtensions)
  );
}

/**
 * Handle placeholder image nodes in figures.
 *
 * This reduces figures to a single representation; it should only be used for static contexts
 * where you do not need to persist the multiple figure representations.
 *
 * If there is a valid image or code node in the figure, the placeholder image is removed.
 * If there is no other valid image or code node, the placeholder image is promoted to normal image.
 *
 * Elsewhere in the mdast tree, placeholder images are just left as-is; currently the only way to
 * author a placeholder image is using a figure directive.
 */
export function transformPlaceholderImages(
  mdast: GenericParent,
  opts?: { imageExtensions?: ImageExtensions[] },
) {
  const validExts = opts?.imageExtensions ?? DEFAULT_IMAGE_EXTENSIONS;
  selectAll('container', mdast)
    .filter((container: GenericNode) => container.kind === 'figure')
    .forEach((figure: GenericNode) => {
      const validContent = figure.children?.filter((child) => {
        return isValidImageNode(child, validExts) && !child.placeholder;
      });
      const placeholders = figure.children?.filter((child) => {
        return isValidImageNode(child, validExts) && child.placeholder;
      });
      if (validContent?.length) {
        placeholders?.forEach((node) => {
          node.type = '__remove__';
        });
      } else {
        placeholders?.forEach((node) => {
          node.placeholder = false;
        });
      }
    });
  remove(mdast, '__remove__');
}

/**
 * Remove all static images
 *
 * This should only be run for web builds
 */
export function removeStaticImages(mdast: GenericParent) {
  selectAll('image', mdast)
    .filter((image: GenericNode) => image.static)
    .forEach((image: GenericNode) => {
      image.type = '__remove__';
    });
  remove(mdast, '__remove__');
}

/**
 * Remove all figure content except static/placeholder, where present
 *
 * This should only be run for static builds
 */
export function removeNonStaticImages(mdast: GenericParent) {
  const containers = selectAll('container', mdast);
  containers.forEach((container: GenericNode) => {
    const hasStatic = !!container.children?.find((child) => child.static);
    const hasPlaceholder = !!container.children?.find((child) => child.placeholder);
    if (!hasStatic && !hasPlaceholder) return;
    container.children = container.children?.filter((child) => {
      if (['caption', 'legend'].includes(child.type)) {
        // Always keep caption/legend
        return true;
      }
      if (hasStatic) {
        // Prioritize static image over placeholder
        return !!child.static;
      }
      return !!child.placeholder;
    });
  });
}

/**
 * Trim base64 values for urlSource when they have been replaced by image urls
 */
export async function transformDeleteBase64UrlSource(mdast: GenericParent) {
  const images = selectAll('image', mdast) as GenericNode[];
  return Promise.all(
    images.map(async (image) => {
      if (image.url && image.urlSource && isBase64(image.urlSource)) {
        const [prefix, suffix] = (image.urlSource as string).split(BASE64_HEADER_SPLIT);
        if (suffix.length <= 20) return;
        image.urlSource = `${prefix}${BASE64_HEADER_SPLIT}${suffix.slice(0, 10)}...${suffix.slice(
          suffix.length - 10,
        )}`;
      }
    }),
  );
}
