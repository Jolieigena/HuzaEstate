import Image, { type ImageProps } from 'next/image';

/** Property uploads are already compressed and served directly by object storage. */
export default function PropertyImage(props: ImageProps) {
  return <Image {...props} alt={props.alt} unoptimized />;
}
