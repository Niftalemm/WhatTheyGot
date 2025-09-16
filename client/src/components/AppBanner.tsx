export default function AppBanner() {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="px-4 py-3">
        <h1 className="text-2xl font-bold text-primary text-center" data-testid="text-app-banner">
          What they Got?
        </h1>
      </div>
    </div>
  );
}