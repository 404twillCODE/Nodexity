export const MINECRAFT_VERSIONS = [
  "1.20.1",
  "1.21.1",
  "1.21.4",
  "1.21.10",
] as const;

export type MinecraftVersion = (typeof MINECRAFT_VERSIONS)[number];

export const PROFILE_OPTIONS = [
  {
    id: "pure-fps",
    name: "Pure FPS",
    tagline: "Minimal performance-only setup",
    description:
      "A clean baseline with essential Fabric performance mods and no unnecessary complexity.",
  },
  {
    id: "pure-fps-plus",
    name: "Pure FPS+",
    tagline: "Performance with quality-of-life extras",
    description:
      "Adds extra convenience and tuning controls while staying focused on smooth, stable FPS.",
  },
  {
    id: "custom",
    name: "Custom",
    tagline: "Manual control over every toggle",
    description:
      "Starts from a clean Nodexity baseline, then lets you fine-tune every option yourself.",
  },
] as const;

export type ProfileType = (typeof PROFILE_OPTIONS)[number]["id"];

export const PERFORMANCE_PRESETS = [
  {
    id: "max-fps",
    name: "Max FPS",
    description:
      "Pushes harder on aggressive reductions and background savings for the highest framerate.",
  },
  {
    id: "balanced",
    name: "Balanced",
    description:
      "Keeps the experience clean and responsive without going too aggressive on visual cutbacks.",
  },
  {
    id: "better-visuals",
    name: "Better Visuals",
    description:
      "Preserves more presentation and convenience while still keeping a performance-first baseline.",
  },
] as const;

export type PerformancePresetId = (typeof PERFORMANCE_PRESETS)[number]["id"];

export const TOGGLE_CATEGORIES = [
  {
    id: "performance-core",
    title: "Performance Core",
    description: "Essential FPS and memory improvements that form the baseline of every pack.",
  },
  {
    id: "visual-utility",
    title: "Visual / Utility Options",
    description: "Quality-of-life controls and lightweight enhancements for daily play.",
  },
  {
    id: "experimental-advanced",
    title: "Experimental / Advanced",
    description:
      "Optional aggressive tuning ideas for players who want to squeeze out extra headroom.",
  },
] as const;

export type ToggleCategoryId = (typeof TOGGLE_CATEGORIES)[number]["id"];

export const TOGGLE_DEFINITIONS = [
  {
    id: "sodium",
    name: "Sodium",
    description: "Modern renderer upgrades for smoother framerates and cleaner graphics settings.",
    category: "performance-core",
  },
  {
    id: "lithium",
    name: "Lithium",
    description: "Game logic optimizations that help improve simulation performance.",
    category: "performance-core",
  },
  {
    id: "ferrite-core",
    name: "FerriteCore",
    description: "Memory usage reductions that help heavier sessions stay stable.",
    category: "performance-core",
  },
  {
    id: "entity-culling",
    name: "Entity Culling",
    description: "Avoids rendering entities you cannot actually see.",
    category: "performance-core",
  },
  {
    id: "more-culling",
    name: "More Culling",
    description: "Adds more aggressive hidden-surface culling for extra FPS.",
    category: "performance-core",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Simple zoom control without changing the core pack focus.",
    category: "visual-utility",
  },
  {
    id: "better-debug-info",
    name: "Better Debug Info",
    description: "Cleaner debug screens and easier visibility into performance details.",
    category: "visual-utility",
  },
  {
    id: "dynamic-fps",
    name: "Dynamic FPS",
    description: "Reduces background usage when Minecraft is unfocused or minimized.",
    category: "visual-utility",
  },
  {
    id: "reeses-sodium-options",
    name: "Reese's Sodium Options",
    description: "Improves the Sodium settings layout for easier tuning and control.",
    category: "visual-utility",
  },
  {
    id: "sodium-extra",
    name: "Sodium Extra",
    description: "Adds extra graphics and performance controls on top of Sodium.",
    category: "visual-utility",
  },
  {
    id: "chunk-optimization",
    name: "Chunk Optimization Options",
    description: "More aggressive chunk-focused tuning for heavy terrain and loading scenarios.",
    category: "experimental-advanced",
  },
  {
    id: "animation-reduction",
    name: "Animation Reduction Options",
    description: "Cuts back non-essential animation load for steadier low-end performance.",
    category: "experimental-advanced",
  },
  {
    id: "particle-reduction",
    name: "Particle Reduction Options",
    description: "Reduces particle overhead in fights, farms, and crowded scenes.",
    category: "experimental-advanced",
  },
] as const;

export type ToggleId = (typeof TOGGLE_DEFINITIONS)[number]["id"];

export interface PureBuilderSelections {
  minecraftVersion: MinecraftVersion;
  profileType: ProfileType;
  performancePreset: PerformancePresetId;
  selectedToggles: ToggleId[];
  pcSuggestion: PcSuggestionId | null;
}

export const PC_SUGGESTIONS = [
  {
    id: "low-end",
    name: "Low-End PC",
    description:
      "Best for older CPUs, integrated graphics, or systems that struggle with larger worlds.",
    recommendation:
      "Recommended: Pure FPS with Max FPS and aggressive reduction toggles enabled.",
    systemExamples: "Good fit for laptops, entry-level desktops, and older Minecraft rigs.",
    profileType: "pure-fps",
    performancePreset: "max-fps",
  },
  {
    id: "mid-range",
    name: "Mid-Range PC",
    description:
      "Balanced performance for typical gaming systems that can handle smoother visuals without wasting FPS.",
    recommendation:
      "Recommended: Pure FPS with Balanced tuning for stable performance and cleaner visuals.",
    systemExamples: "Good fit for modern mid-range CPUs and mainstream dedicated GPUs.",
    profileType: "pure-fps",
    performancePreset: "balanced",
  },
  {
    id: "high-end",
    name: "High-End PC",
    description:
      "For stronger CPUs and GPUs that can keep extra quality-of-life options without compromising responsiveness.",
    recommendation:
      "Recommended: Pure FPS+ with Better Visuals for a cleaner experience and headroom to spare.",
    systemExamples: "Good fit for enthusiast desktops and newer high-refresh setups.",
    profileType: "pure-fps-plus",
    performancePreset: "better-visuals",
  },
] as const;

export type PcSuggestionId = (typeof PC_SUGGESTIONS)[number]["id"];

const PROFILE_BASE_TOGGLES: Record<ProfileType, readonly ToggleId[]> = {
  "pure-fps": [
    "sodium",
    "lithium",
    "ferrite-core",
    "entity-culling",
    "more-culling",
    "dynamic-fps",
  ],
  "pure-fps-plus": [
    "sodium",
    "lithium",
    "ferrite-core",
    "entity-culling",
    "more-culling",
    "dynamic-fps",
    "zoom",
    "better-debug-info",
    "reeses-sodium-options",
    "sodium-extra",
  ],
  custom: [
    "sodium",
    "lithium",
    "ferrite-core",
    "entity-culling",
    "dynamic-fps",
  ],
};

const PRESET_TOGGLE_RULES: Record<
  PerformancePresetId,
  { enable: readonly ToggleId[]; disable: readonly ToggleId[] }
> = {
  "max-fps": {
    enable: [
      "more-culling",
      "dynamic-fps",
      "chunk-optimization",
      "animation-reduction",
      "particle-reduction",
    ],
    disable: [],
  },
  balanced: {
    enable: [
      "more-culling",
      "dynamic-fps",
      "chunk-optimization",
      "zoom",
      "sodium-extra",
    ],
    disable: ["animation-reduction", "particle-reduction"],
  },
  "better-visuals": {
    enable: [
      "zoom",
      "better-debug-info",
      "dynamic-fps",
      "reeses-sodium-options",
      "sodium-extra",
    ],
    disable: ["animation-reduction", "particle-reduction"],
  },
};

const TOGGLE_MAP = new Map(TOGGLE_DEFINITIONS.map((toggle) => [toggle.id, toggle]));

export const defaultPureBuilderSelections: PureBuilderSelections = {
  minecraftVersion: "1.21.4",
  profileType: "pure-fps",
  performancePreset: "balanced",
  selectedToggles: buildRecommendedToggleIds("pure-fps", "balanced"),
  pcSuggestion: "mid-range",
};

export function orderToggleIds(toggleIds: Iterable<ToggleId>): ToggleId[] {
  const enabled = new Set(toggleIds);
  return TOGGLE_DEFINITIONS.filter((toggle) => enabled.has(toggle.id)).map(
    (toggle) => toggle.id,
  );
}

export function normalizeToggleIds(toggleIds: string[]): ToggleId[] {
  const validIds = new Set<ToggleId>(TOGGLE_DEFINITIONS.map((toggle) => toggle.id));
  const filtered = toggleIds.filter((toggleId): toggleId is ToggleId =>
    validIds.has(toggleId as ToggleId),
  );
  return orderToggleIds(new Set(filtered));
}

export function buildRecommendedToggleIds(
  profileType: ProfileType,
  performancePreset: PerformancePresetId,
): ToggleId[] {
  const enabled = new Set<ToggleId>(PROFILE_BASE_TOGGLES[profileType]);
  const rules = PRESET_TOGGLE_RULES[performancePreset];

  rules.enable.forEach((toggleId) => enabled.add(toggleId));
  rules.disable.forEach((toggleId) => enabled.delete(toggleId));

  return orderToggleIds(enabled);
}

export function buildPcSuggestedSelections(
  pcSuggestion: PcSuggestionId,
  minecraftVersion: MinecraftVersion,
): PureBuilderSelections {
  const suggestion = PC_SUGGESTIONS.find((item) => item.id === pcSuggestion);
  if (!suggestion) {
    return {
      ...defaultPureBuilderSelections,
      minecraftVersion,
    };
  }

  return {
    minecraftVersion,
    profileType: suggestion.profileType,
    performancePreset: suggestion.performancePreset,
    selectedToggles: buildRecommendedToggleIds(
      suggestion.profileType,
      suggestion.performancePreset,
    ),
    pcSuggestion,
  };
}

export function getToggleById(toggleId: ToggleId) {
  return TOGGLE_MAP.get(toggleId);
}

export function getToggleDefinitionsByIds(toggleIds: ToggleId[]) {
  return orderToggleIds(toggleIds)
    .map((toggleId) => getToggleById(toggleId))
    .filter((toggle): toggle is (typeof TOGGLE_DEFINITIONS)[number] => Boolean(toggle));
}
