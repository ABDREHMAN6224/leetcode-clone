import React from 'react'
import { SocketProvider } from './utils/SokcetContext'

type Props = {
    children: React.ReactNode
}

function Providers({ children }: Props) {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  )
}

export default Providers