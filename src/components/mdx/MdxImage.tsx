import Image from 'next/image';

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  caption?: string;
  priority?: boolean;
};

export function MdxImage({
  src,
  alt,
  width,
  height,
  className,
  caption,
  priority = false,
}: Props) {
  return (
    <figure className="my-4">
      <div className={className}>
        <Image src={src} alt={alt} width={width ?? 900} height={height ?? 600} priority={priority} />
      </div>
      {caption ? <figcaption className="mt-2 text-xs text-slate-500">{caption}</figcaption> : null}
    </figure>
  );
}
