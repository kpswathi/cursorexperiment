import { cn } from '@/lib/cn'

export function EntityLogo({
  src,
  alt,
  size = 36,
  className,
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-md border border-line bg-raised object-cover', className)}
    />
  )
}
