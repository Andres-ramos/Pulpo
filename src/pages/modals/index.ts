import PublishModal from "./PublishModal";
import ShareModal from "./ShareModal";
import DisclaimerModal from "./DisclaimerModal"

export const MODALS = {
  publish: PublishModal,
  share: ShareModal,
  disclaimer: DisclaimerModal
} as const;

export type ModalName = keyof typeof MODALS;
