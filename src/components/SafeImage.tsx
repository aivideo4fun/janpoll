import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'alt'> {
  alt?: string;
}

export default function SafeImage({ alt, src, ...props }: SafeImageProps) {
  // यदि alt नहीं दिया गया है, तो स्वतः यह डिफ़ॉल्ट alt सेट हो जाएगा
  const defaultAlt = alt && alt.trim() !== '' 
    ? alt 
    : 'JanPoll Rajasthan - राजस्थान पंचायत चुनाव ओपिनियन पोल';

  return <Image src={src} alt={defaultAlt} {...props} />;
}