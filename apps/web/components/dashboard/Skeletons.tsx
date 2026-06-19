import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function KpiSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-12 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-8 w-24 rounded bg-muted animate-pulse mb-1" />
        <div className="h-3 w-32 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 pt-6">
        <div className="flex items-end gap-2" style={{ height: height - 60 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-muted animate-pulse"
              style={{
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-between">
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
