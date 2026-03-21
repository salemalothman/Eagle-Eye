import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';

interface Props {
  viewer: Cesium.Viewer;
}

export function EarthquakeLayer({ viewer }: Props) {
  const entitiesRef = useRef<Cesium.Entity[]>([]);

  const earthquakes = useStore((s) => s.earthquakes);
  const visible = useStore((s) => s.layers.earthquakes.visible);
  const selectEntity = useStore((s) => s.selectEntity);

  useEffect(() => {
    // Clean up old entities
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }
    entitiesRef.current = [];

    if (!visible || earthquakes.size === 0) return;

    for (const [, quake] of earthquakes) {
      // Radius scales exponentially with magnitude
      const radius = Math.pow(2, quake.magnitude) * 1000;
      // Color intensity by magnitude
      const alpha = Math.min(0.3 + quake.magnitude * 0.1, 0.8);

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(quake.lon, quake.lat),
        ellipse: {
          semiMajorAxis: radius,
          semiMinorAxis: radius,
          material: Cesium.Color.RED.withAlpha(alpha),
          outline: true,
          outlineColor: Cesium.Color.RED.withAlpha(0.9),
          outlineWidth: 2,
          height: 0,
        },
        label: {
          text: `M${quake.magnitude.toFixed(1)}`,
          font: '10px JetBrains Mono',
          fillColor: Cesium.Color.fromCssColorString('#ff3d3d'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          translucencyByDistance: new Cesium.NearFarScalar(1e4, 1.0, 1e7, 0.0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      (entity as any)._quakeId = quake.id;
      entitiesRef.current.push(entity);
    }

    // Click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id && (picked.id as any)._quakeId) {
        const quake = useStore.getState().earthquakes.get((picked.id as any)._quakeId);
        if (quake) selectEntity(quake, 'earthquake');
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [viewer, earthquakes, visible, selectEntity]);

  return null;
}
