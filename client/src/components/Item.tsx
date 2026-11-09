'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye } from 'lucide-react';

export interface ItemType {
    id: string;
    title: string;
    slug: string;
    description: string;
    image_url: string;
    images: string[];
    category: string;
    condition: string;
    status: 'draft' | 'published' | 'archived';
    created_at: string;
    updated_at: string;
}

// ---------- STATUS STYLES ----------
const statusStyles: Record<ItemType['status'], string> = {
    published:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    draft:
        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    archived: 'bg-muted text-muted-foreground border-border',
};

interface ItemProps {
    item: ItemType;
    onDelete?: (item: ItemType) => void;
}

export default function Item({ item }: ItemProps) {
    const navigate = useNavigate();

    const handleView = () => navigate(`/admin/items/${item.id}`);



    return (
        <Card className="group flex flex-col overflow-hidden border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md">
            {/* ---- Clickable image ---- */}
            <button
                type="button"
                onClick={handleView}
                className="relative h-44 w-full overflow-hidden bg-muted text-left"
            >
                <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                />
                <Badge className="absolute left-3 top-3 border-0 bg-background/90 text-foreground backdrop-blur-sm hover:bg-background/90">
                    {item.category}
                </Badge>
                <Badge
                    variant="outline"
                    className={`absolute right-3 top-3 border uppercase ${statusStyles[item.status]}`}
                >
                    {item.status}
                </Badge>

                {/* Hover overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow">
                        <Eye className="h-3.5 w-3.5" />
                        View details
                    </span>
                </div>
            </button>

            {/* ---- Body ---- */}
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="space-y-1">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
                        {item.title}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {item.description || 'No description'}
                    </p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="capitalize">{item.condition}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>

            </CardContent>
        </Card>
    );
}