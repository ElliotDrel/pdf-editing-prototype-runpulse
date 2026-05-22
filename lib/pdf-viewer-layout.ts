export const PDF_PANEL_HEIGHT_CLASS = "h-[480px] lg:h-[calc(100vh-220px)]";

/** Shared PDF iframe container height. Parent must set explicit height for h-full children. */
export const PDF_VIEWER_FRAME_CLASS = `${PDF_PANEL_HEIGHT_CLASS} w-full`;

/** Taller frame for the single-view result page. */
export const PDF_RESULT_SINGLE_FRAME_CLASS =
	"h-[720px] lg:h-[calc(100vh-200px)] w-full";
