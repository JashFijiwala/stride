'use client'

import { motion } from 'framer-motion'

const variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex-1"
    >
      {children}
    </motion.div>
  )
}
