import { motion } from 'framer-motion';

const PAGE_FADE_DURATION_S = 0.35;
const PAGE_SLIDE_DISTANCE_PX = 16;

interface Props {
  children: React.ReactNode;
}

/** Einheitlicher Page-Transition-Wrapper fuer AnimatePresence-Routen. */
export default function PageTransition({ children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: PAGE_SLIDE_DISTANCE_PX }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -PAGE_SLIDE_DISTANCE_PX }}
      transition={{ duration: PAGE_FADE_DURATION_S, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}
