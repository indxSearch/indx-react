import { Routes, Route } from 'react-router-dom';
import Home from './page';
import Layout from './Layout';

// Import all component pages
import ButtonPage from './button/page';
import CheckboxPage from './checkbox/page';
import InputFieldPage from './input-field/page';
import RadioButtonPage from './radio-button/page';
import SearchFieldPage from './search-field/page';
import SelectPage from './select/page';
import SliderPage from './slider/page';
import BarSliderPage from './bar-slider/page';
import ScrubSliderPage from './scrub-slider/page';
import BarMeterPage from './bar-meter/page';
import WafflePage from './waffle/page';
import HeatmapPage from './heatmap/page';
import RadialChartPage from './radial-chart/page';
import RadarChartPage from './radar-chart/page';
import GroupedBarsPage from './grouped-bars/page';
import TreeCanvasPage from './tree-canvas/page';
import ToggleSwitchPage from './toggle-switch/page';
import PopoverPage from './popover/page';
import BasePage from './base/page';
import FilterPanelBasePage from './filter-panel-base/page';
import ChipPage from './chip/page';
import AlertPage from './alert/page';
import SaveBarPage from './save-bar/page';
import TruncatePage from './truncate/page';
import TooltipPage from './tooltip/page';
import IconsPage from './icons/page';
import SearchInputPage from './search-input/page';
import SearchResultsStatesPage from './search-results-states/page';
import FilterPanelStatesPage from './filter-panel-states/page';
import ValueFilterPanelPage from './value-filter-panel/page';
import RangeFilterPanelPage from './range-filter-panel/page';
import BucketFilterPanelPage from './bucket-filter-panel/page';
import SortByPanelPage from './sort-by-panel/page';
import ActiveFiltersPanelPage from './active-filters-panel/page';
import FilterPanelSkeletonPage from './filter-panel-skeleton/page';
import SearchResultPage from './search-result/page';
import TablePage from './table/page';
import TabsPage from './tabs/page';
import SegmentedControlPage from './segmented-control/page';
import DisclosurePage from './disclosure/page';
import BreadcrumbsPage from './breadcrumbs/page';
import NavigationMenuPage from './navigation-menu/page';
import ProgressBarPage from './progress-bar/page';
import SpinnersPage from './spinners/page';
import CursorsPage from './cursors/page';
import PatternsPage from './patterns/page';
import ChartPage from './chart/page';
import SparklinePage from './sparkline/page';
import DatasetCardPage from './dataset-card/page';
import QuestionSuggestionsPage from './question-suggestions/page';
import TextareaPage from './textarea/page';
import ModalPage from './modal/page';
import DatePickerPage from './date-picker/page';
import ChatPage from './chat/page';
import SearchResultsMessagePage from './search-results-message/page';
import SearchSettingsPanelPage from './search-settings-panel/page';
import SearchErrorBoundaryPage from './search-error-boundary/page';
import CodeCopyPage from './code-copy/page';
import SearchOrAskPage from './search-or-ask/page';
import SkeletonPage from './skeleton/page';
import StatPage from './stat/page';
import DatasetPageMockup from './dataset-page/page';
import ConsoleShellMockup from './console-shell/page';
import AskPanelPage from './ask-panel/page';
import AnalyticsDashboardPage from './analytics-dashboard/page';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/button" element={<ButtonPage />} />
        <Route path="/checkbox" element={<CheckboxPage />} />
        <Route path="/input-field" element={<InputFieldPage />} />
        <Route path="/radio-button" element={<RadioButtonPage />} />
        <Route path="/search-field" element={<SearchFieldPage />} />
        <Route path="/select" element={<SelectPage />} />
        <Route path="/slider" element={<SliderPage />} />
        <Route path="/bar-slider" element={<BarSliderPage />} />
        <Route path="/scrub-slider" element={<ScrubSliderPage />} />
        <Route path="/bar-meter" element={<BarMeterPage />} />
        <Route path="/waffle" element={<WafflePage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/radial-chart" element={<RadialChartPage />} />
        <Route path="/radar-chart" element={<RadarChartPage />} />
        <Route path="/grouped-bars" element={<GroupedBarsPage />} />
        <Route path="/tree-canvas" element={<TreeCanvasPage />} />
        <Route path="/toggle-switch" element={<ToggleSwitchPage />} />
        <Route path="/popover" element={<PopoverPage />} />
        <Route path="/base" element={<BasePage />} />
        <Route path="/filter-panel-base" element={<FilterPanelBasePage />} />
        <Route path="/chip" element={<ChipPage />} />
        <Route path="/alert" element={<AlertPage />} />
        <Route path="/save-bar" element={<SaveBarPage />} />
        <Route path="/truncate" element={<TruncatePage />} />
        <Route path="/tooltip" element={<TooltipPage />} />
        <Route path="/table" element={<TablePage />} />
        <Route path="/tabs" element={<TabsPage />} />
        <Route path="/segmented-control" element={<SegmentedControlPage />} />
        <Route path="/disclosure" element={<DisclosurePage />} />
        <Route path="/breadcrumbs" element={<BreadcrumbsPage />} />
        <Route path="/navigation-menu" element={<NavigationMenuPage />} />
        <Route path="/progress-bar" element={<ProgressBarPage />} />
        <Route path="/spinners" element={<SpinnersPage />} />
        <Route path="/icons" element={<IconsPage />} />
        <Route path="/search-input" element={<SearchInputPage />} />
        <Route path="/search-results-states" element={<SearchResultsStatesPage />} />
        <Route path="/filter-panel-states" element={<FilterPanelStatesPage />} />
        <Route path="/value-filter-panel" element={<ValueFilterPanelPage />} />
        <Route path="/range-filter-panel" element={<RangeFilterPanelPage />} />
        <Route path="/bucket-filter-panel" element={<BucketFilterPanelPage />} />
        <Route path="/sort-by-panel" element={<SortByPanelPage />} />
        <Route path="/active-filters-panel" element={<ActiveFiltersPanelPage />} />
        <Route path="/filter-panel-skeleton" element={<FilterPanelSkeletonPage />} />
        <Route path="/search-result" element={<SearchResultPage />} />
        <Route path="/cursors" element={<CursorsPage />} />
        <Route path="/patterns" element={<PatternsPage />} />
        <Route path="/chart" element={<ChartPage />} />
        <Route path="/sparkline" element={<SparklinePage />} />
        <Route path="/dataset-card" element={<DatasetCardPage />} />
        <Route path="/question-suggestions" element={<QuestionSuggestionsPage />} />
        <Route path="/textarea" element={<TextareaPage />} />
        <Route path="/modal" element={<ModalPage />} />
        <Route path="/date-picker" element={<DatePickerPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/search-results-message" element={<SearchResultsMessagePage />} />
        <Route path="/search-settings-panel" element={<SearchSettingsPanelPage />} />
        <Route path="/search-error-boundary" element={<SearchErrorBoundaryPage />} />
        <Route path="/code-copy" element={<CodeCopyPage />} />
        <Route path="/search-or-ask" element={<SearchOrAskPage />} />
        <Route path="/skeleton" element={<SkeletonPage />} />
        <Route path="/stat" element={<StatPage />} />
        <Route path="/dataset-page" element={<DatasetPageMockup />} />
        <Route path="/console-shell" element={<ConsoleShellMockup />} />
        <Route path="/ask-panel" element={<AskPanelPage />} />
        <Route path="/analytics-dashboard" element={<AnalyticsDashboardPage />} />
      </Routes>
    </Layout>
  );
}
