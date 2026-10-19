import { useColorMode, useThemeConfig } from '@docusaurus/theme-common'
import ColorModeToggle from '@theme/ColorModeToggle'
import type { Props } from '@theme/Navbar/ColorModeToggle'
import type { ReactNode } from 'react'

// The site follows the OS color scheme until you click. The default toggle then
// cycles system → light → dark, so the first click often changes nothing on
// screen. This toggle always flips between the light and dark mode you see.
export default function NavbarColorModeToggle({ className }: Props): ReactNode {
  const { disableSwitch } = useThemeConfig().colorMode
  const { colorMode, setColorMode } = useColorMode()

  if (disableSwitch) return null

  return (
    <ColorModeToggle
      className={className}
      respectPrefersColorScheme={false}
      value={colorMode}
      onChange={setColorMode}
    />
  )
}
