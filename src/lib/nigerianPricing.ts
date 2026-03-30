/**
 * Nigerian Market Pricing Database
 * Updated with realistic Lagos/Abuja market rates (2024-2025)
 */

export interface PriceRange {
  min: number;
  max: number;
  average: number;
  unit: string;
}

export interface TradePricing {
  materials: Record<string, PriceRange>;
  labour: Record<string, PriceRange>;
  logistics: Record<string, PriceRange>;
}

// Helper to create price range
const price = (min: number, max: number, unit: string): PriceRange => ({
  min,
  max,
  average: Math.round((min + max) / 2),
  unit
});

// ELECTRICAL PRICING
export const ELECTRICAL_PRICING: TradePricing = {
  materials: {
    "16mm_cable_single": price(18000, 25000, "roll"),
    "10mm_cable_single": price(12000, 18000, "roll"),
    "4mm_cable_single": price(9000, 15000, "roll"),
    "2.5mm_cable_single": price(7000, 12000, "roll"),
    "1.5mm_cable_single": price(5000, 8000, "roll"),
    "socket_13a": price(500, 1200, "piece"),
    "switch_1gang": price(400, 900, "piece"),
    "switch_2gang": price(600, 1200, "piece"),
    "mcb_breaker_single": price(2000, 4000, "piece"),
    "mcb_breaker_double": price(3500, 6000, "piece"),
    "distribution_board_12way": price(25000, 45000, "unit"),
    "distribution_board_18way": price(35000, 60000, "unit"),
    "conduit_pipe_20mm": price(600, 1200, "length"),
    "conduit_pipe_25mm": price(800, 1500, "length"),
    "surface_trunking": price(1200, 2500, "length"),
    "ceiling_rose": price(300, 600, "piece"),
    "holder_batten": price(200, 500, "piece"),
    "junction_box": price(400, 800, "piece"),
    "cable_clips": price(50, 150, "piece"),
  },
  labour: {
    "bedroom_wiring_complete": price(40000, 80000, "room"),
    "sitting_room_wiring": price(50000, 100000, "room"),
    "kitchen_wiring": price(45000, 85000, "room"),
    "bathroom_wiring": price(30000, 60000, "room"),
    "installation_per_light_point": price(2000, 5000, "point"),
    "installation_per_socket_point": price(2500, 5500, "point"),
    "distribution_board_installation": price(25000, 50000, "job"),
    "change_over_switch_installation": price(35000, 70000, "job"),
    "rewiring_per_room": price(35000, 70000, "room"),
  },
  logistics: {
    "transportation_local": price(5000, 15000, "trip"),
    "transportation_interstate": price(20000, 50000, "trip"),
    "mobilization": price(10000, 30000, "job"),
  }
};

// PLUMBING PRICING
export const PLUMBING_PRICING: TradePricing = {
  materials: {
    "pvc_pipe_4inch": price(4000, 7000, "length"),
    "pvc_pipe_3inch": price(3000, 5000, "length"),
    "pvc_pipe_2inch": price(2000, 3500, "length"),
    "pvc_pipe_1inch": price(1200, 2000, "length"),
    "pvc_pipe_half_inch": price(800, 1500, "length"),
    "toilet_wc_standard": price(35000, 80000, "unit"),
    "toilet_wc_premium": price(80000, 200000, "unit"),
    "sink_kitchen": price(15000, 60000, "unit"),
    "wash_hand_basin": price(12000, 45000, "unit"),
    "shower_mixer_standard": price(25000, 60000, "unit"),
    "shower_mixer_premium": price(60000, 150000, "unit"),
    "water_pump_half_hp": price(45000, 80000, "unit"),
    "water_pump_1hp": price(80000, 150000, "unit"),
    "overhead_tank_500l": price(35000, 60000, "unit"),
    "overhead_tank_1000l": price(55000, 95000, "unit"),
    "pvc_elbow": price(200, 500, "piece"),
    "pvc_tee": price(250, 600, "piece"),
    "pvc_reducer": price(300, 700, "piece"),
    "ball_valve": price(1500, 4000, "piece"),
  },
  labour: {
    "bathroom_complete_installation": price(60000, 150000, "bathroom"),
    "toilet_installation": price(25000, 50000, "unit"),
    "pipe_installation_per_room": price(15000, 40000, "room"),
    "water_pump_installation": price(20000, 45000, "job"),
    "overhead_tank_installation": price(25000, 55000, "job"),
    "drainage_work_per_meter": price(3000, 6000, "meter"),
  },
  logistics: {
    "transportation_local": price(7000, 20000, "trip"),
    "mobilization": price(15000, 35000, "job"),
  }
};

// BUILDING/CONSTRUCTION PRICING
export const BUILDING_PRICING: TradePricing = {
  materials: {
    "cement_dangote": price(5500, 7500, "bag"),
    "cement_bua": price(5300, 7200, "bag"),
    "sharp_sand": price(25000, 45000, "trip"),
    "fine_sand": price(20000, 38000, "trip"),
    "granite_half_inch": price(30000, 55000, "trip"),
    "granite_three_quarter": price(32000, 58000, "trip"),
    "blocks_6inch": price(350, 550, "piece"),
    "blocks_9inch": price(450, 650, "piece"),
    "iron_rods_10mm": price(4500, 6500, "length"),
    "iron_rods_12mm": price(5000, 7500, "length"),
    "iron_rods_16mm": price(6500, 9500, "length"),
    "binding_wire": price(2500, 4000, "kg"),
    "roofing_sheets_longspan": price(4500, 7000, "sheet"),
    "roofing_sheets_stone_coated": price(8000, 15000, "sheet"),
    "ceiling_board_pop": price(1800, 3500, "sheet"),
    "ceiling_board_gypsum": price(2500, 4500, "sheet"),
  },
  labour: {
    "bricklaying": price(1500, 2800, "sqm"),
    "plastering": price(2000, 3500, "sqm"),
    "screeding": price(1500, 2500, "sqm"),
    "roofing": price(3500, 6500, "sqm"),
    "pop_ceiling": price(4000, 8000, "sqm"),
    "tiling_floor": price(2500, 5000, "sqm"),
    "tiling_wall": price(3000, 6000, "sqm"),
  },
  logistics: {
    "transportation_sand_granite": price(10000, 25000, "trip"),
    "transportation_blocks": price(8000, 20000, "trip"),
    "mobilization": price(20000, 50000, "job"),
  }
};

// PAINTING PRICING
export const PAINTING_PRICING: TradePricing = {
  materials: {
    "emulsion_paint_economy": price(8000, 15000, "bucket"),
    "emulsion_paint_standard": price(15000, 25000, "bucket"),
    "emulsion_paint_premium": price(25000, 45000, "bucket"),
    "gloss_paint_standard": price(10000, 20000, "bucket"),
    "gloss_paint_premium": price(20000, 40000, "bucket"),
    "primer_sealer": price(6000, 12000, "bucket"),
    "putty": price(4000, 8000, "bucket"),
    "screeding_powder": price(3500, 6000, "bag"),
    "paint_brush_2inch": price(500, 1200, "piece"),
    "paint_brush_3inch": price(700, 1500, "piece"),
    "roller_frame": price(1500, 3000, "piece"),
    "roller_sleeve": price(800, 2000, "piece"),
  },
  labour: {
    "painting_per_room": price(25000, 60000, "room"),
    "painting_per_sqm": price(1500, 3500, "sqm"),
    "screeding_per_sqm": price(1000, 2000, "sqm"),
    "pop_ceiling_painting": price(2000, 4000, "sqm"),
    "door_painting": price(5000, 12000, "door"),
    "window_painting": price(3000, 8000, "window"),
  },
  logistics: {
    "transportation_local": price(3000, 10000, "trip"),
    "mobilization": price(5000, 15000, "job"),
  }
};

// CARPENTRY PRICING
export const CARPENTRY_PRICING: TradePricing = {
  materials: {
    "plywood_18mm": price(12000, 18000, "sheet"),
    "plywood_12mm": price(8000, 13000, "sheet"),
    "blockboard": price(9000, 15000, "sheet"),
    "mdf_board": price(10000, 16000, "sheet"),
    "hardwood_2by4": price(2500, 4500, "length"),
    "hardwood_2by2": price(1500, 2800, "length"),
    "nails_3inch": price(1500, 2500, "kg"),
    "wood_glue": price(2000, 4000, "bottle"),
    "hinges_3inch": price(500, 1200, "pair"),
    "door_handle": price(3000, 15000, "set"),
    "door_lock": price(5000, 25000, "unit"),
  },
  labour: {
    "door_installation": price(15000, 35000, "door"),
    "wardrobe_installation": price(80000, 200000, "unit"),
    "kitchen_cabinet": price(120000, 350000, "kitchen"),
    "ceiling_installation": price(3000, 6000, "sqm"),
    "partition_wall": price(4000, 8000, "sqm"),
  },
  logistics: {
    "transportation_local": price(5000, 15000, "trip"),
    "mobilization": price(10000, 25000, "job"),
  }
};

// Get pricing for specific trade
export function getPricingForTrade(trade: string): TradePricing {
  const tradeMap: Record<string, TradePricing> = {
    'electrician': ELECTRICAL_PRICING,
    'electrical': ELECTRICAL_PRICING,
    'plumber': PLUMBING_PRICING,
    'plumbing': PLUMBING_PRICING,
    'builder': BUILDING_PRICING,
    'building': BUILDING_PRICING,
    'construction': BUILDING_PRICING,
    'painter': PAINTING_PRICING,
    'painting': PAINTING_PRICING,
    'carpenter': CARPENTRY_PRICING,
    'carpentry': CARPENTRY_PRICING,
  };

  return tradeMap[trade.toLowerCase()] || ELECTRICAL_PRICING;
}

// Search for item in pricing database
export function searchPricingItem(query: string, trade: string): PriceRange | null {
  const pricing = getPricingForTrade(trade);
  const searchTerm = query.toLowerCase().replace(/\s+/g, '_');

  // Search in materials
  for (const [key, value] of Object.entries(pricing.materials)) {
    if (key.includes(searchTerm) || searchTerm.includes(key.split('_')[0])) {
      return value;
    }
  }

  // Search in labour
  for (const [key, value] of Object.entries(pricing.labour)) {
    if (key.includes(searchTerm) || searchTerm.includes(key.split('_')[0])) {
      return value;
    }
  }

  return null;
}

// Get all categories for a trade
export function getCategoriesForTrade(trade: string): string[] {
  return ['Materials', 'Labour', 'Transportation', 'Miscellaneous'];
}

// Calculate miscellaneous (typically 5-10% of total)
export function calculateMiscellaneous(subtotal: number): number {
  return Math.round(subtotal * 0.08); // 8% of subtotal
}

// Validate price is within reasonable Nigerian market range
export function validatePrice(price: number, itemType: string): boolean {
  if (price < 100) return false; // Too low
  if (price > 10000000) return false; // Too high (>10M)

  // More specific validation could be added here
  return true;
}

// Format price in Nigerian Naira
export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
