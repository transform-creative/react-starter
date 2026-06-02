import { ErrorLabelType } from "~/data/CommonTypes";
import Cropper, { Area } from "react-easy-crop";
import {
  CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import { logError } from "~/database/Auth";
import { Icon } from "../Icon";
import {
  compressImage,
  getCroppedImg,
  getDefaultCropArea,
  uploadImage,
  validateMimeType,
  ModerationRejectionError,
  type ModerationFn,
} from "./ImageHandlerBL";
import { DateTime } from "luxon";
import { IoniconName } from "~/data/Ionicons";
import * as spinners from "react-spinners";

export interface ImageHandlerProps {
  /**The supabase bucket to upload to */
  bucket: string;
  /**The filepath in supabase (i.e. `${session.user.id}/${new Date.toIsoString()}_profile`) */
  filePath: string;
  /**Size in bytes (mb * 1 000 000) */
  maxSize?: number;
  /**File types the handler accepts */
  accept?: string;
  /**Pass in a default image for when there's no url */
  defaultImage?: string | undefined;
  /**An icon for before a user selects an image */
  placeholderIcon?: IoniconName | undefined;
  /**Whether to add the outline class to the image picker */
  outline?: boolean;
  style?: CSSProperties;

  /** Max output width in pixels — scaled down proportionally if exceeded */
  maxWidth?: number;
  /** Max output height in pixels — scaled down proportionally if exceeded */
  maxHeight?: number;
  /** JPEG compression quality 0–1 (default 0.82) */
  quality?: number;
  /*********************************
   * After the image is cropped and
   * uploaded, use this function to perform actions
   */
  onChange: (path: string | null) => void;
  /** Called whenever the pending-crop state changes (true = image selected but crop not yet confirmed) */
  onCropPending?: (isPending: boolean) => void;
  /** Optional server-side moderation hook. When omitted, uploads go straight
   * to `bucket` without quarantine. */
  moderationFn?: ModerationFn;
}

/******************************
 * ImageHandler component:
 * Handles selecting, cropping and processing images
 * using the 'react-easy-crop' library
 */
export function ImageHandler({
  bucket,
  filePath,
  maxSize = 10000000,
  accept = "image/*",
  defaultImage,
  placeholderIcon,
  outline = false,
  style = {
    height: 200,
    aspectRatio: 1,
    borderRadius: "var(--border)",
  },
  maxWidth,
  maxHeight,
  quality,
  onChange,
  onCropPending,
  moderationFn,
}: ImageHandlerProps) {
  const pickerRef =
    useRef<HTMLInputElement>(null);
  const [logoLoading, setLogoLoading] =
    useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<
    string | null
  >();
  const [sourceUrl, setSourceUrl] = useState<
    string | null
  >();
  const [isCropping, setIsCropping] =
    useState(false);
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState<Area>();
  const [error, setError] =
    useState<ErrorLabelType>({
      active: false,
    });

  const aspect =
    (style?.aspectRatio as number) || 1;

  useEffect(() => {
    onCropPending?.(
      isCropping || (logoLoading && !uploadedUrl),
    );
  }, [isCropping, logoLoading, uploadedUrl]);

  useEffect(() => {
    return () => {
      if (sourceUrl)
        URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  /**************************************
   * Allow user to pick an image from their
   * file explorer
   */
  function pickImage() {
    removeImage();
    if (pickerRef.current)
      pickerRef.current.value = "";
    pickerRef.current?.click();
  }

  function removeImage() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
    setUploadedUrl(null);
    setIsCropping(false);
    onChange(null);
  }

  /***************************************
   * Validate the picked file, create a local object
   * URL, then immediately auto-crop (centred default
   * crop), compress and upload — no extra step.
   */
  function handlePickedFile(
    file: File | undefined,
  ) {
    if (!file) return;
    if (!validateMimeType(file)) {
      setError({
        active: true,
        text: "Unsupported file type. Please pick a JPEG, PNG, WebP or GIF.",
      });
      return;
    }
    if (file.size > maxSize) {
      setError({
        active: true,
        text: `Your image must be smaller than ${maxSize / 1000000}mb`,
      });
      return;
    }
    setError({ active: false });
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    autoCropAndUpload(url);
  }

  /*************************************
   * Compute the default centred crop for the
   * configured aspect ratio and upload it.
   */
  async function autoCropAndUpload(url: string) {
    try {
      const area = await getDefaultCropArea(
        url,
        aspect,
      );
      await cropAndUpload(area, url);
    } catch (error: any) {
      await logError(error, [
        "autoCropAndUpload",
      ]);
      setError({
        active: true,
        text: "There was an issue processing this image.",
      });
    }
  }

  /*************************************
   * Crop, compress and upload the image
   * in a single pass — only now does it
   * leave the browser.
   */
  async function cropAndUpload(
    area: Area,
    src?: string,
  ) {
    const source = src ?? sourceUrl;
    if (!source) return;

    setLogoLoading(true);
    try {
      const croppedFile = (await getCroppedImg(
        source,
        area,
        0,
      )) as File | null;
      if (!croppedFile) return;

      const toUpload = await compressImage(
        croppedFile,
        {
          maxWidth,
          maxHeight,
          quality,
        },
      );
      const { url } = await uploadImage(
        bucket,
        `${filePath}_${DateTime.now().toMillis()}`,
        toUpload,
        moderationFn,
      );
      if (!url) return;

      setUploadedUrl(url);
      setIsCropping(false);
      setError({ active: false });
      onChange(url);
    } catch (error: any) {
      await logError(error, ["cropAndUpload"]);
      setError({
        active: true,
        text:
          error instanceof
          ModerationRejectionError
            ? error.reason
            : "There was an issue uploading this image.",
      });
    } finally {
      setLogoLoading(false);
    }
  }

  /****************************************************
   * Update the state variable showing what's croppped
   * @param pixels
   */
  const onCropComplete = (pixels: Area) => {
    setCroppedAreaPixels(pixels);
  };

  return (
    <div
      className="fade-sm boxed row"
      style={{
        borderRadius: style.borderRadius,
        minHeight: style.minHeight || "none",
      }}
    >
      {isCropping ? (
        <div
          className="col w-100 middle center p0"
          style={{ position: "relative" }}
        >
          <div
            style={{
              ...style,
              position: "relative",
            }}
          >
            <Cropper
              objectFit="cover"
              image={sourceUrl as string}
              crop={crop}
              onCropChange={setCrop}
              zoom={zoom}
              onZoomChange={setZoom}
              onCropComplete={(_area, pixels) =>
                onCropComplete(pixels)
              }
              style={{
                containerStyle: {
                  ...style,
                  border: "none",
                },
              }}
              aspect={aspect}
            />
            {logoLoading && (
              <div
                className="middle center"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor:
                    "var(--accent-sm)",
                }}
              >
                <spinners.BeatLoader size={12} />
              </div>
            )}
          </div>
          <div
            className="row mt-10 gap-5 "
            style={{
              position: "absolute",
              bottom: 10,
            }}
          >
            <button
              onClick={() =>
                croppedAreaPixels &&
                cropAndUpload(croppedAreaPixels)
              }
              className="row middle center gap-5 accent p-5"
              style={{ borderRadius: "50%" }}
              type="button"
            >
              <Icon
                name="checkmark"
                color="var(--txt)"
                size={20}
              />
            </button>
            <button
              onClick={() => setIsCropping(false)}
              className="row middle center gap-5 p-5"
              style={{ borderRadius: "50%" }}
              type="button"
            >
              <Icon
                name="close"
                color="var(--txt)"
                size={20}
              />
            </button>
          </div>
        </div>
      ) : logoLoading && !uploadedUrl ? (
        <div
          style={{
            ...style,
            position: "relative",
          }}
        >
          {sourceUrl && (
            <img
              src={sourceUrl}
              style={{ ...style, border: "none" }}
              alt="uploading"
            />
          )}
          <div
            className="middle center"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "var(--accent-sm)",
            }}
          >
            <spinners.BeatLoader size={12} />
          </div>
        </div>
      ) : uploadedUrl ? (
        <div
          className=""
          style={{
            ...style,
            position: "relative",
          }}
        >
          <div
            className="row gap-5"
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              zIndex: 100,
            }}
          >
            <div className="boxed col gap-10">
              <Icon
                name="crop"
                className="clickable"
                color="var(--txt)"
                size={25}
                onClick={() =>
                  setIsCropping(true)
                }
              />

              <Icon
                name="close-circle"
                className="clickable"
                color="var(--danger)"
                size={25}
                onClick={() => removeImage()}
              />
            </div>
          </div>

          <img
            className="basicImage clickable"
            onClick={() => pickImage()}
            src={uploadedUrl}
            style={{ ...style, border: "none" }}
            alt={`image`}
          />
        </div>
      ) : (
        <div
          className="col middle center w-100"
          style={{
            position: "relative",
            borderRadius: style.borderRadius,
          }}
        >
          {defaultImage && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                zIndex: 1,
              }}
            >
              <Icon
                name="close-circle"
                className="clickable"
                color="var(--danger)"
                size={25}
                onClick={() => removeImage()}
              />
            </div>
          )}
          <div
            className={`col middle center clickable${outline ? " outline-secondary" : ""}`}
            style={style}
            onClick={() => pickImage()}
          >
            {defaultImage ? (
              <div className="row w-100 center">
                <img
                  style={style}
                  src={defaultImage}
                />
              </div>
            ) : (
              <Icon
                name={
                  placeholderIcon ||
                  "image-outline"
                }
                size={
                  (style?.height as number) / 2 ||
                  100
                }
                color="var(--accent-md)"
              />
            )}
          </div>
        </div>
      )}
      <input
        ref={pickerRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) =>
          handlePickedFile(
            (e.target.files &&
              e.target.files[0]) ||
              undefined,
          )
        }
      />
      <div
        className="w-100 col middle center"
        style={{
          position: "fixed",
          top: 70,
          left: 0,
          zIndex: 20,
          margin: 0,
        }}
      >
        {error.active && (
          <div
            className="r-default p-5 row middle center gap-10"
            style={{
              backgroundColor: "var(--danger)",
              zIndex: 50,
            }}
          >
            <Icon
              name="warning"
              color="var(--accent-sm)"
            />
            <h4
              className="center"
              style={{
                color: "var(--accent-sm)",
              }}
            >
              {error.text}
            </h4>
          </div>
        )}
      </div>
    </div>
  );
}
