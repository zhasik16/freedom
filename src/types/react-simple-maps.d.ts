declare module "react-simple-maps" {
    import * as React from "react";

    export interface ProjectionConfig {
        scale?: number;
        xOffset?: number;
        yOffset?: number;
        rotation?: [number, number, number];
        center?: [number, number];
        parallels?: [number, number];
    }

    export interface ComposableMapProps {
        width?: number;
        height?: number;
        projection?: string | function;
        projectionConfig?: ProjectionConfig;
        className?: string;
        style?: React.CSSProperties;
        children?: React.ReactNode;
    }
    export const ComposableMap: React.FC<ComposableMapProps>;

    export interface GeographiesProps {
        geography: string | Record<string, any> | string[];
        children: (data: { geographies: any[] }) => React.ReactNode;
        parseGeographies?: (geographies: any[]) => any[];
        className?: string;
    }
    export const Geographies: React.FC<GeographiesProps>;

    export interface GeographyProps {
        geography: any;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        style?: {
            default?: React.CSSProperties;
            hover?: React.CSSProperties;
            pressed?: React.CSSProperties;
        };
        onMouseEnter?: (event: React.MouseEvent) => void;
        onMouseLeave?: (event: React.MouseEvent) => void;
        onClick?: (event: React.MouseEvent) => void;
    }
    export const Geography: React.FC<GeographyProps>;

    export interface MarkerProps {
        coordinates: [number, number];
        onClick?: (event: React.MouseEvent) => void;
        onMouseEnter?: (event: React.MouseEvent) => void;
        onMouseLeave?: (event: React.MouseEvent) => void;
        style?: React.CSSProperties;
        className?: string;
        children?: React.ReactNode;
    }
    export const Marker: React.FC<MarkerProps>;

    export interface AnnotationProps {
        subject: [number, number];
        dx: number;
        dy: number;
        curve?: number;
        connectorProps?: React.SVGProps<SVGPathElement>;
        children?: React.ReactNode;
    }
    export const Annotation: React.FC<AnnotationProps>;

    export interface ZoomableGroupProps {
        center?: [number, number];
        zoom?: number;
        minZoom?: number;
        maxZoom?: number;
        onMoveStart?: (position: any, event: any) => void;
        onMove?: (position: any, event: any) => void;
        onMoveEnd?: (position: any, event: any) => void;
        children?: React.ReactNode;
    }
    export const ZoomableGroup: React.FC<ZoomableGroupProps>;
}
