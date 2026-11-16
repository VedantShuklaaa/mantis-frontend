const SITE_NOTE = "Mantis runs on Solana devnet. Never send mainnet funds.";

export default function SiteFooter() {
  return (
    <footer className="mx-auto mt-auto w-full max-w-2xl px-5 pb-6 pt-10">
      <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        {SITE_NOTE}
      </p>
    </footer>
  );
}
