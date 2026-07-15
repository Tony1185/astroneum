import { type Component } from '@/react-shared'

import {
  horizontalStraightLine, horizontalRayLine, horizontalSegment,
  verticalStraightLine, verticalRayLine, verticalSegment,
  straightLine, rayLine, segment, arrow, priceLine,
  priceChannelLine, parallelStraightLine,
  fibonacciLine, fibonacciSegment, fibonacciCircle, fibonacciSpiral,
  fibonacciSpeedResistanceFan, fibonacciExtension, gannBox, gannFan, pitchfork,
  circle, triangle, rect, parallelogram,
  threeWaves, fiveWaves, eightWaves, anyWaves,
  abcd, xabcd,
  weakMagnet, strongMagnet, noMagnet, snapLevels,
  visible, invisible,
  lock, unlock,
  remove,
  crossCursor, dotCursor, arrowCursor, eraserCursor,
  measure, zoomIn, keepDrawing,
  longPosition, shortPosition, positionForecast, barsPattern, ghostFeed, sector,
  anchoredVwap, fixedRangeVolumeProfile, anchoredVolumeProfile,
  priceRange, dateRange, dateAndPriceRange, forecasting,
  textNote
} from './icons'

import type { SelectDataSourceItem } from '@/component'

import i18n from '@/i18n'

export const mapping = {
  horizontalStraightLine,
  horizontalRayLine,
  horizontalSegment,
  verticalStraightLine,
  verticalRayLine,
  verticalSegment,
  straightLine,
  rayLine,
  segment,
  arrow,
  priceLine,
  priceChannelLine,
  parallelStraightLine,
  fibonacciLine,
  fibonacciSegment,
  fibonacciCircle,
  fibonacciSpiral,
  fibonacciSpeedResistanceFan,
  fibonacciExtension,
  gannBox,
  gannFan,
  pitchfork,
  circle,
  triangle,
  rect,
  parallelogram,
  threeWaves,
  fiveWaves,
  eightWaves,
  anyWaves,
  abcd,
  xabcd,
  weak_magnet: weakMagnet,
  strong_magnet: strongMagnet,
  no_magnet: noMagnet,
  snap_levels: snapLevels,
  lock,
  unlock,
  visible,
  invisible,
  remove,
  crossCursor,
  dotCursor,
  arrowCursor,
  eraserCursor,
  measure,
  zoomIn,
  keepDrawing,
  longPosition,
  shortPosition,
  positionForecast,
  barsPattern,
  ghostFeed,
  sector,
  anchoredVwap,
  fixedRangeVolumeProfile,
  anchoredVolumeProfile,
  priceRange,
  dateRange,
  dateAndPriceRange,
  forecasting,
  textNote,
  simpleAnnotation: textNote
}

export function createSingleLineOptions (locale: string): SelectDataSourceItem[] {
  return  [
    { key: 'horizontalStraightLine', text: i18n('horizontal_straight_line', locale) },
    { key: 'horizontalRayLine', text: i18n('horizontal_ray_line', locale) },
    { key: 'horizontalSegment', text: i18n('horizontal_segment', locale) },
    { key: 'verticalStraightLine', text: i18n('vertical_straight_line', locale) },
    { key: 'verticalRayLine', text: i18n('vertical_ray_line', locale) },
    { key: 'verticalSegment', text: i18n('vertical_segment', locale) },
    { key: 'straightLine', text: i18n('straight_line', locale) },
    { key: 'rayLine', text: i18n('ray_line', locale) },
    { key: 'segment', text: i18n('segment', locale) },
    { key: 'arrow', text: i18n('arrow', locale) },
    { key: 'priceLine', text: i18n('price_line', locale) }
  ]
}

export function createMoreLineOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'priceChannelLine', text: i18n('price_channel_line', locale) },
    { key: 'parallelStraightLine', text: i18n('parallel_straight_line', locale) }
  ]
}

export function createPolygonOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'circle', text: i18n('circle', locale) },
    { key: 'rect', text: i18n('rect', locale) },
    { key: 'parallelogram', text: i18n('parallelogram', locale) },
    { key: 'triangle', text: i18n('triangle', locale) }
  ]
}

export function createFibonacciOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'fibonacciLine', text: i18n('fibonacci_line', locale) },
    { key: 'fibonacciSegment', text: i18n('fibonacci_segment', locale) },
    { key: 'fibonacciCircle', text: i18n('fibonacci_circle', locale) },
    { key: 'fibonacciSpiral', text: i18n('fibonacci_spiral', locale) },
    { key: 'fibonacciSpeedResistanceFan', text: i18n('fibonacci_speed_resistance_fan', locale) },
    { key: 'fibonacciExtension', text: i18n('fibonacci_extension', locale) },
    { key: 'gannBox', text: i18n('gann_box', locale) },
    { key: 'gannFan', text: i18n('gann_fan', locale) },
    { key: 'pitchfork', text: i18n('pitchfork', locale) }
  ]
}

export function createWaveOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'xabcd', text: i18n('xabcd', locale) },
    { key: 'abcd', text: i18n('abcd', locale) },
    { key: 'threeWaves', text: i18n('three_waves', locale) },
    { key: 'fiveWaves', text: i18n('five_waves', locale) },
    { key: 'eightWaves', text: i18n('eight_waves', locale) },
    { key: 'anyWaves', text: i18n('any_waves', locale) },
  ]
}

export function createMagnetOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'no_magnet',     text: i18n('no_magnet', locale) },
    { key: 'weak_magnet',   text: i18n('weak_magnet', locale) },
    { key: 'strong_magnet', text: i18n('strong_magnet', locale) }
  ]
}

export function createCursorOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'crossCursor', text: i18n('cross_cursor', locale) },
    { key: 'dotCursor', text: i18n('dot_cursor', locale) },
    { key: 'arrowCursor', text: i18n('arrow_cursor', locale) },
    { key: 'eraserCursor', text: i18n('eraser_cursor', locale) }
  ]
}

interface IconProps {
  class?: string
  name: string
}

// @ts-expect-error mapping is dynamically keyed; props.name accesses it safely
export const Icon: Component<IconProps> = props => mapping[props.name](props.class)


export function createForecastingOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: '__header_forecasting', text: i18n('forecasting', locale), isHeader: true },
    { key: 'longPosition', text: i18n('long_position', locale) },
    { key: 'shortPosition', text: i18n('short_position', locale) },
    { key: 'positionForecast', text: i18n('position_forecast', locale) },
    { key: 'barsPattern', text: i18n('bars_pattern', locale) },
    { key: 'ghostFeed', text: i18n('ghost_feed', locale) },
    { key: 'sector', text: i18n('sector', locale) },
    { key: '__header_volume_based', text: i18n('volume_based', locale), isHeader: true },
    { key: 'anchoredVwap', text: i18n('anchored_vwap', locale) },
    { key: 'fixedRangeVolumeProfile', text: i18n('fixed_range_volume_profile', locale) },
    { key: 'anchoredVolumeProfile', text: i18n('anchored_volume_profile', locale) },
    { key: '__header_measurers', text: i18n('measurers', locale), isHeader: true },
    { key: 'priceRange', text: i18n('price_range', locale) },
    { key: 'dateRange', text: i18n('date_range', locale) },
    { key: 'dateAndPriceRange', text: i18n('date_and_price_range', locale) }
  ]
}

export function createAnnotationOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'simpleAnnotation', text: i18n('text_note', locale) }
  ]
}
