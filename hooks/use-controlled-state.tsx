import * as React from "react"

interface CommonControlledStateProps<T> {
  value?: T
  defaultValue?: T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useControlledState<T, Rest extends any[] = []>(
  props: CommonControlledStateProps<T> & {
    onChange?: (value: T, ...args: Rest) => void
  }
): readonly [T, (next: T, ...args: Rest) => void] {
  const { value, defaultValue, onChange } = props

  const [uncontrolled, setUncontrolled] = React.useState<T>(
    value !== undefined ? value : (defaultValue as T)
  )
  const state = value !== undefined ? value : uncontrolled

  const setState = React.useCallback(
    (next: T, ...args: Rest) => {
      if (value === undefined) setUncontrolled(next)
      onChange?.(next, ...args)
    },
    [onChange, value]
  )

  return [state, setState] as const
}
