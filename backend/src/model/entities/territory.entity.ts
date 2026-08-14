import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import type { Geometry, MultiPolygon } from 'geojson';
import { GEOM_SRID } from '../geo.constants';

@Entity({
    name: 'territories',
    schema: 'public_app'
})
export class Territory {

    @PrimaryColumn({
        name: 'id',
        type: 'integer',
        generated: 'increment'
    })
    id: number;

    @PrimaryColumn({
        name: 'version',
        type: 'integer'
    })
    version: number;

    @Column({
        name: 'name',
        type: 'varchar',
        length: 500
    })
    name: string;

    @Column({
        name: 'source',
        type: 'varchar'
    })
    source: string;

    @Column({
        name: 'category',
        type: 'varchar'
    })
    category: string;

    @Column({
        name: 'category_name',
        type: 'varchar',
        generated: true,
        select: false
    })
    categoryName: string;

    @CreateDateColumn({
        name: 'inserted_at',
        type: 'timestamp',
        default: () => 'now()'
    })
    insertedAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'now()'
    })
    updatedAt: Date;

    @Column({
        name: 'area_ha',
        type: 'numeric',
        precision: 14,
        scale: 5,
        generated: true,
        nullable: true
    })
    areaHa: number;

    @Column({
        name: 'geom',
        type: 'geometry',
        spatialFeatureType: 'MultiPolygon',
        srid: GEOM_SRID,
        nullable: true
    })
    geometry: MultiPolygon;

    @Column({
        name: 'old_geom',
        type: 'geometry',
        spatialFeatureType: 'MultiPolygon',
        srid: GEOM_SRID,
        nullable: true
    })
    oldGeometry: MultiPolygon;

    @Column({
        name: 'enabled',
        type: 'boolean',
        default: true
    })
    enabled: boolean;

    @Column({
        name: 'source_id_type',
        type: 'varchar',
        nullable: true
    })
    sourceIdType: string;

    @Column({
        name: 'source_id_value',
        type: 'text',
        nullable: true
    })
    sourceIdValue: string;
}