import {
  MINECRAFT_VERSIONS,
  PERFORMANCE_PRESETS,
  PC_SUGGESTIONS,
  PROFILE_OPTIONS,
  TOGGLE_DEFINITIONS,
  buildRecommendedToggleIds,
  defaultPureBuilderSelections,
  getToggleDefinitionsByIds,
  normalizeToggleIds,
  type MinecraftVersion,
  type PcSuggestionId,
  type PerformancePresetId,
  type ProfileType,
  type PureBuilderSelections,
} from "@/lib/pure-fps";

export interface GeneratedPackConfig {
  schemaVersion: number;
  packType: "nodexity-pure-fps";
  productName: "Nodexity Pure FPS";
  createdAt: string;
  launcher: "Modrinth";
  modLoader: "Fabric";
  status: "Ready to Build";
  filenameHint: string;
  selections: PureBuilderSelections;
  summary: {
    version: MinecraftVersion;
    profile: string;
    preset: string;
    enabledToggleCount: number;
    enabledToggles: string[];
    pcSuggestionLabel: string | null;
  };
  instructions: string[];
  notes: string[];
}

const CURRENT_SCHEMA_VERSION = 1;

function isMinecraftVersion(value: unknown): value is MinecraftVersion {
  return typeof value === "string" && MINECRAFT_VERSIONS.includes(value as MinecraftVersion);
}

function isProfileType(value: unknown): value is ProfileType {
  return (
    typeof value === "string" &&
    PROFILE_OPTIONS.some((profile) => profile.id === value)
  );
}

function isPerformancePreset(value: unknown): value is PerformancePresetId {
  return (
    typeof value === "string" &&
    PERFORMANCE_PRESETS.some((preset) => preset.id === value)
  );
}

function isPcSuggestionId(value: unknown): value is PcSuggestionId {
  return (
    typeof value === "string" &&
    PC_SUGGESTIONS.some((suggestion) => suggestion.id === value)
  );
}

function toFilenameVersion(version: MinecraftVersion) {
  return version.replace(/\./g, "-");
}

export function createPackFilename(version: MinecraftVersion) {
  return `nodexity-pure-fps-${toFilenameVersion(version)}.json`;
}

export function createGeneratedPackConfig(
  selections: PureBuilderSelections,
): GeneratedPackConfig {
  const profile = PROFILE_OPTIONS.find((item) => item.id === selections.profileType);
  const preset = PERFORMANCE_PRESETS.find(
    (item) => item.id === selections.performancePreset,
  );
  const suggestion = selections.pcSuggestion
    ? PC_SUGGESTIONS.find((item) => item.id === selections.pcSuggestion) ?? null
    : null;
  const toggleNames = getToggleDefinitionsByIds(selections.selectedToggles).map(
    (toggle) => toggle.name,
  );

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    packType: "nodexity-pure-fps",
    productName: "Nodexity Pure FPS",
    createdAt: new Date().toISOString(),
    launcher: "Modrinth",
    modLoader: "Fabric",
    status: "Ready to Build",
    filenameHint: createPackFilename(selections.minecraftVersion),
    selections,
    summary: {
      version: selections.minecraftVersion,
      profile: profile?.name ?? selections.profileType,
      preset: preset?.name ?? selections.performancePreset,
      enabledToggleCount: selections.selectedToggles.length,
      enabledToggles: toggleNames,
      pcSuggestionLabel: suggestion?.name ?? null,
    },
    instructions: [
      "Open Modrinth App.",
      "Click Add Instance.",
      "Click Import from file.",
      "Select your downloaded Nodexity Pure FPS config.",
      "Launch Minecraft.",
    ],
    notes: [
      "This is a mock export for the future web-based pack generator.",
      "Replace this JSON export with real .mrpack generation when backend build logic is ready.",
      "You can re-import this file into the Update My Pack flow to rebuild your selections later.",
    ],
  };
}

export function downloadGeneratedPack(config: GeneratedPackConfig) {
  if (typeof window === "undefined") return;

  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = config.filenameHint;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function buildSelectionsFromUnknown(value: unknown): PureBuilderSelections {
  const source =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const rawSelections =
    typeof source.selections === "object" && source.selections !== null
      ? (source.selections as Record<string, unknown>)
      : source;

  const minecraftVersion = isMinecraftVersion(rawSelections.minecraftVersion)
    ? rawSelections.minecraftVersion
    : defaultPureBuilderSelections.minecraftVersion;
  const profileType = isProfileType(rawSelections.profileType)
    ? rawSelections.profileType
    : defaultPureBuilderSelections.profileType;
  const performancePreset = isPerformancePreset(rawSelections.performancePreset)
    ? rawSelections.performancePreset
    : defaultPureBuilderSelections.performancePreset;
  const pcSuggestion = isPcSuggestionId(rawSelections.pcSuggestion)
    ? rawSelections.pcSuggestion
    : null;
  const selectedToggles = Array.isArray(rawSelections.selectedToggles)
    ? normalizeToggleIds(
        rawSelections.selectedToggles.filter(
          (toggleId): toggleId is string => typeof toggleId === "string",
        ),
      )
    : [];

  return {
    minecraftVersion,
    profileType,
    performancePreset,
    selectedToggles:
      selectedToggles.length > 0
        ? selectedToggles
        : buildRecommendedToggleIds(profileType, performancePreset),
    pcSuggestion,
  };
}

export function parsePurePackConfig(raw: string): PureBuilderSelections {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  const selections = buildSelectionsFromUnknown(parsed);
  const source =
    typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;

  if (source && "packType" in source) {
    if (source.packType !== "nodexity-pure-fps") {
      throw new Error("This file is not a Nodexity Pure FPS config.");
    }
  }

  return selections;
}

export function isKnownPurePackFileName(fileName: string) {
  return fileName.toLowerCase().includes("nodexity-pure-fps");
}

export const PURE_PACK_TOGGLE_IDS = TOGGLE_DEFINITIONS.map((toggle) => toggle.id);
