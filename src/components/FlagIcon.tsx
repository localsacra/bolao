import { getFlagCode } from '../utils/flagCode'

interface Props {
  country: string
  size?: 'sm' | 'md' | 'lg'
}

export function FlagIcon({ country, size = 'md' }: Props) {
  const code = getFlagCode(country)
  const sizeClass = {
    sm: 'w-6 h-4',
    md: 'w-10 h-7',
    lg: 'w-14 h-10'
  }[size]

  return (
    <span
      className={`fi fi-${code} ${sizeClass} rounded-sm shadow-sm`}
      title={country}
    />
  )
}
