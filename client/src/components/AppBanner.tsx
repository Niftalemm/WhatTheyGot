import { AuthButton } from "./AuthButton";

export default function AppBanner() {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary" data-testid="text-app-banner">
            What they Got?
          </h1>
          <AuthButton />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1" data-testid="text-disclaimer">
          Not affiliated with Minnesota State University, Mankato or Sodexo
        </p>
      </div>
    </div>
  );
}