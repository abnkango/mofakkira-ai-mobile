import { Text, type TextProps } from 'react-native'

const NativeText = Text as typeof Text & { defaultProps?: TextProps }
NativeText.defaultProps = {
  ...NativeText.defaultProps,
  style: [{ textAlign: 'right', writingDirection: 'rtl' }, NativeText.defaultProps?.style],
}
