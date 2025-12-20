import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";
import Cropper, { Area } from "react-easy-crop";
import { Icon } from "./Icon";
import { useRef, useState } from "react";
import { logError } from "~/database/Auth";

export interface ImageHandlerProps {
  maxSize?: number;
  accept: string;
  height?: number;
  defaultImage?: string | undefined;

  /**************************************************
   * This function needs to turn a file into a url string which can be accessed by the image handler
   * @param f The file
   * @returns url: a url directly to the file, path: a private string
   */
  onUpload: (f: File) => Promise<string | null>;
  /*********************************
   * After the image is cropped and
   * uploaded, use this function to save the URL somewhere
   */
  onCrop: (path: string) => void;
}

/******************************
 * ImageHandler component:
 * Handles selecting, cropping and processing images
 * using the 'react-easy-crop' library
 */
export function ImageHandler({
  maxSize = 5000000,
  height = 200,
  accept,
  defaultImage,
  onUpload,
  onCrop,
}: ImageHandlerProps) {
  const context: SharedContextProps =
    useOutletContext();
  const pickerRef =
    useRef<HTMLInputElement>(null);
  const [logoLoading, setLogoLoading] =
    useState(false);
  const [croppedImage, setCroppedImage] =
    useState<string>();
  const [downloadLogoUrl, setDownloadLogoUrl] =
    useState<string>();
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState<Area>();

  /**************************************
   * Allow user to pick an image from their
   * file explorer
   */
  function pickImage() {
    setCroppedImage(undefined);
    setDownloadImage(undefined);
    setDownloadLogoUrl(undefined);
    pickerRef.current?.click();
  }

  /***************************************
   * Handle uploading images to the server
   * and updating state
   * @param file
   * @returns
   */
  async function setDownloadImage(
    file: File | undefined
  ) {
    if (!file) return;
    if (file.size > maxSize) {
      context.popAlert(
        "Your image must be smaller than 5MB",
        undefined,
        true
      );
      return;
    }

    const url = await onUpload(file);

    if (!url) return;
    setDownloadLogoUrl(url);
    return url;
  }

  /*************************************
   * Finally, handle cropping an image to 1 x 1 format
   */
  async function createCroppedImage() {
    if (!downloadLogoUrl) return;

    try {
      const croppedImage = (await getCroppedImg(
        downloadLogoUrl,
        croppedAreaPixels,
        0
      )) as File;
      let url = await setDownloadImage(
        croppedImage
      );
      setCroppedImage(url || undefined);
      url && onCrop(url);
    } catch (error: any) {
      await logError(error, ["createCroppedImage"]);
      return;
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
      className="mediumFade w100 middle center"
      style={{
        margin: 0,
      }}
    >
      {downloadLogoUrl ? (
        logoLoading ? (
          <div className="middle center">
            <p>Loading...</p>
          </div>
        ) : croppedImage ? (
          <div
            className="p2"
            style={{
              height: height,
              borderRadius: "var(--border)",
              aspectRatio: "1/1",
            }}
          >
            <img
              className="basicImage clickable"
              onClick={() => pickImage()}
              src={croppedImage}
              style={{
                width: "100%",
                borderRadius: "250px",
              }}
              alt={`image`}
            />
          </div>
        ) : (
          <div className="boxed">
            <div
              style={{
                position: "relative",
                height: height,
                width: height,
              }}
            >
              <Cropper
                image={downloadLogoUrl}
                crop={crop}
                onCropChange={setCrop}
                zoom={zoom}
                onZoomChange={setZoom}
                onCropComplete={(area, pixels) =>
                  onCropComplete(pixels)
                }
                aspect={1 / 1}
              />
            </div>
            <button
              onClick={createCroppedImage}
              className="w100 mt2 accentButton row middle center gap5"
              type="button"
            >
              <Icon
                name="checkmark-circle"
                color="var(--bg)"
              />
              Add image
            </button>
          </div>
        )
      ) : (
        <div className="col middle center w100">
          <div
            className="col middle center clickable p2"
            style={{
              height: height,
              width: height,
              borderRadius: "150px",
              aspectRatio: "1 / 1",
            }}
            onClick={() => pickImage()}
          >
            {defaultImage ? (
              <div className="row w100 center">
                <img
                  style={{
                    height: 200,
                    width: 200,
                    borderRadius: 100,
                  }}
                  src={defaultImage}
                />
              </div>
            ) : (
              <Icon
                name="person-circle"
                size={height}
                color="var(--accent-sm)"
              />
            )}
          </div>
          <input
            ref={pickerRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={(e) =>
              setDownloadImage(
                (e.target.files &&
                  e.target.files[0]) ||
                  undefined
              )
            }
          />
        </div>
      )}
    </div>
  );
}

export const createImage = (url: string) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () =>
      resolve(image)
    );
    image.addEventListener("error", (error) =>
      reject(error)
    );
    image.setAttribute(
      "crossOrigin",
      "anonymous"
    ); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

export function getRadianAngle(
  degreeValue: number
) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(
  width: number,
  height: number,
  rotation: number
) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) +
      Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) +
      Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: any,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) {
  const image = (await createImage(
    imageSrc
  )) as HTMLImageElement;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } =
    rotateSize(
      image.width,
      image.height,
      rotation
    );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(
    flip.horizontal ? -1 : 1,
    flip.vertical ? -1 : 1
  );
  ctx.translate(
    -image.width / 2,
    -image.height / 2
  );

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  const croppedCanvas =
    document.createElement("canvas");

  const croppedCtx =
    croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return null;
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // As Base64 string
  // return croppedCanvas.toDataURL('image/jpeg');

  // As a blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((file) => {
      resolve(file);
    }, "image/png");
  });
}
