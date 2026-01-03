import { navigateLinkedIn } from "../utils/linkedin-navigate";

interface LinkedInLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /** The LinkedIn path to navigate to */
  to: string;
  children: React.ReactNode;
}

/**
 * A link component that navigates within LinkedIn without page reload.
 * Keeps the sidebar and other content script UI intact.
 *
 * @example
 * // Basic usage
 * <LinkedInLink to="/feed/">Go to Feed</LinkedInLink>
 *
 * // With styling
 * <LinkedInLink to="/in/username/" className="text-blue-500 hover:underline">
 *   View Profile
 * </LinkedInLink>
 *
 * // Full URL also works
 * <LinkedInLink to="https://www.linkedin.com/in/someone/">
 *   External Profile
 * </LinkedInLink>
 */
export function LinkedInLink({
  to,
  children,
  onClick,
  ...props
}: LinkedInLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.(e);
    navigateLinkedIn(to);
  };

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
