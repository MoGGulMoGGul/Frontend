import Image from "next/image";
import HexagonWrapper from "./HexagonWrapper";

type HexImageProps = {
  src?: string;
  width: string;
  height: string;
  top: string;
  left?: string;
  rotate?: string;
  transform?: string;
  z?: number;
};

export default function HexImage({
  src,
  width,
  height,
  top,
  left = "left-1/2",
  rotate = "",
  transform,
  z = 0,
}: HexImageProps) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: z }}>
      <HexagonWrapper bg="transparent" />
      {src && (
        <div
          className={`absolute ${width} ${height} ${top} ${left} ${rotate}`}
          style={{ transform }}
        >
          <Image src={src} alt="장식 이미지" fill className="object-contain" />
        </div>
      )}
    </div>
  );
}
