import { GITHUB_REPO_URL, PRODUCT_NAME } from "@/lib/constants";

type Props = {
  className?: string;
};

export function GitHubLink({ className }: Props) {
  return (
    <a
      href={GITHUB_REPO_URL}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${PRODUCT_NAME} on GitHub`}
    >
      GitHub
    </a>
  );
}
