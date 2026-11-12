import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Gauge } from '../components/Gauge';
import { LineChart } from '../components/LineChart';
import {
  achievements,
  buildCreditRatingInputsFromState,
  calculateAcquisitionPrice,
  calculateCreditRating,
  calculateDepartmentUpgradeCost,
  calculateLoanOfferRate,
  calculateMarketShareRatio,
  calculateOwnershipComposition,
  calculatePortfolioValue,
  canEstablishHolding,
  canIncorporate,
  canUnlockResearchNode,
  cities,
  generateEmployeeCandidates,
  getCityBrandAwareness,
  HOLDING_ESTABLISHMENT_COST,
  HOLDING_MIN_CITY_COUNT,
  HOLDING_MIN_STORE_COUNT,
  INCORPORATION_COST,
  marketingCampaignPresets,
  menuCatalog,
  researchTree,
  type DepartmentType,
  type EntityType,
  type ExecutiveTitle,
  type MarketingCampaignPreset,
  type ResearchBranch,
  type StartupSector,
  type StartupStage,
} from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import { AppButton } from '../components/AppButton';
import { DonutChart } from '../components/DonutChart';
import { GridBackdrop } from '../components/GridBackdrop';
import { getCityImage } from '../assets/images/registry';
import { CheckCircleIcon, WarningIcon } from '../icons';
import { colors } from '../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

const EXECUTIVE_TITLES: ExecutiveTitle[] = ['CMO', 'CFO', 'COO', 'CTO'];

// 本社設立先は東京固定(MVPの簡略化。将来的に都市選択UIに拡張する)。
const HEADQUARTERS_CITY_ID = 'city-tokyo';

const IPO_SHARE_PRICE = 500;
const IPO_TOTAL_SHARES = 100000;
const IPO_PUBLIC_FLOAT_SHARES = 30000;

const DONUT_COLORS = [colors.roast, colors.roastLight, colors.positive, colors.gold, colors.negative];

const DEPARTMENT_LABELS: Record<DepartmentType, string> = {
  it: '技術',
  marketing: '宣伝',
  hr: '人事',
  finance: '財務',
};
const DEPARTMENT_ICONS: Record<DepartmentType, keyof typeof Ionicons.glyphMap> = {
  it: 'hardware-chip',
  marketing: 'megaphone',
  hr: 'people',
  finance: 'calculator',
};
const DEPARTMENT_ORDER: DepartmentType[] = ['it', 'marketing', 'hr', 'finance'];

const LOAN_PRESETS = [
  { label: '短期融資', principal: 2_000_000, annualInterestRate: 0.06, termTurns: 12 },
  { label: '中期融資', principal: 8_000_000, annualInterestRate: 0.08, termTurns: 24 },
  { label: '長期融資', principal: 40_000_000, annualInterestRate: 0.1, termTurns: 48 },
];

const HQ_UPGRADE_COST_PER_TIER = 800_000;

// VC投資: 1クリックあたりの固定出資額(既存のacquireCompetitor等と同じ「1アクション=1確定額」の設計)。
const STARTUP_INVESTMENT_AMOUNT = 2_000_000;

const STARTUP_SECTOR_LABELS: Record<StartupSector, string> = {
  coffeeTech: 'コーヒーテック(シナジー)',
  retailSaas: '小売SaaS(シナジー)',
  logistics: '物流(シナジー)',
  fintech: 'フィンテック',
  consumerApp: '消費者向けアプリ',
  other: 'その他',
};

const STARTUP_STAGE_LABELS: Record<StartupStage, string> = {
  seed: 'シード',
  seriesA: 'シリーズA',
  seriesB: 'シリーズB',
  growth: 'グロース',
  exited: 'イグジット済み',
  failed: '破綻',
};

type DepartmentTabKey = 'org' | 'hq' | 'exec' | 'marketing' | 'ipo' | 'loans' | 'ma' | 'research' | 'menu' | 'achievements';

const TABS: { key: DepartmentTabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'org', label: '組織', icon: 'ribbon' },
  { key: 'hq', label: '本社', icon: 'business' },
  { key: 'exec', label: '役員', icon: 'people-circle' },
  { key: 'marketing', label: '宣伝', icon: 'megaphone' },
  { key: 'ipo', label: '投資', icon: 'trending-up' },
  { key: 'loans', label: '融資', icon: 'cash' },
  { key: 'ma', label: 'M&A', icon: 'git-merge' },
  { key: 'research', label: '研究', icon: 'flask' },
  { key: 'menu', label: 'メニュー開発', icon: 'restaurant' },
  { key: 'achievements', label: '実績', icon: 'trophy' },
];

const RESEARCH_BRANCH_LABELS: Record<ResearchBranch, string> = {
  app: 'モバイル&自社アプリ',
  eco: 'エコ&サプライチェーン',
  machine: 'マシン&品質',
  marketing: 'SNS&集客',
  staff: '接客&人材',
};
const RESEARCH_BRANCH_ICONS: Record<ResearchBranch, keyof typeof Ionicons.glyphMap> = {
  app: 'phone-portrait',
  eco: 'leaf',
  machine: 'cafe',
  marketing: 'megaphone',
  staff: 'people',
};
const RESEARCH_BRANCHES: ResearchBranch[] = ['app', 'eco', 'machine', 'marketing', 'staff'];

const MENU_CATEGORY_LABELS: Record<string, string> = {
  coffee: 'コーヒー',
  tea: '紅茶・お茶',
  tapioca: 'タピオカ',
  cake: 'ケーキ',
  sandwich: 'サンドイッチ・軽食',
  merchandise: '物販',
};
const MENU_CATEGORIES = ['coffee', 'tea', 'tapioca', 'cake', 'sandwich', 'merchandise'] as const;

const ENTITY_STAGE_META: Record<EntityType, { label: string; description: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  soleProprietorship: {
    label: '個人事業主',
    description: '所得税(累進課税)・住民税・個人事業税が決算で一括課税される。売上1,000万円超で消費税課税事業者へ。',
    icon: 'person',
    color: colors.textSecondary,
  },
  corporation: {
    label: '株式会社',
    description: '法人税(軽減税率二段階)+法人住民税均等割。社会保険料が毎月の固定費として発生する。',
    icon: 'business',
    color: colors.gold,
  },
  holding: {
    label: 'ホールディングス',
    description: 'グループ経営体制。多店舗・多都市展開したブランドを持株会社として統括する。',
    icon: 'layers',
    color: colors.positive,
  },
};

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <View className="flex-row items-center gap-xs py-[2px]">
      {met ? <CheckCircleIcon size={14} color={colors.positive} /> : <WarningIcon size={14} color={colors.textMuted} />}
      <Text className={`text-xs ${met ? 'text-text-primary' : 'text-text-muted'}`}>{label}</Text>
    </View>
  );
}

function SectionLabel({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="mb-xs flex-row items-center gap-xs">
      <Ionicons name={icon} size={15} color={colors.roastLight} />
      <Text className="text-[13px] font-medium text-text-secondary">{label}</Text>
    </View>
  );
}

function CardBox({ children }: { children: React.ReactNode }) {
  return <View className="gap-xs rounded-md border border-border bg-surface p-md">{children}</View>;
}

function CatalogRow({
  index,
  disabled,
  onPress,
  children,
}: {
  index: number;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      className={`flex-row items-center justify-between py-sm ${index === 0 ? '' : 'border-t border-border'} ${disabled ? 'opacity-40' : ''}`}
      disabled={disabled}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function CorporateScreen() {
  const navigation = useNavigation<Navigation>();
  const state = useGameStore((s) => s.state);
  const latestBalanceSheet = useGameStore((s) => s.latestBalanceSheet);
  const latestIncomeStatement = useGameStore((s) => s.latestIncomeStatement);
  const establishHeadquarters = useGameStore((s) => s.establishHeadquarters);
  const upgradeHeadquartersAction = useGameStore((s) => s.upgradeHeadquartersAction);
  const upgradeDepartmentAction = useGameStore((s) => s.upgradeDepartmentAction);
  const hireExecutive = useGameStore((s) => s.hireExecutive);
  const launchCampaign = useGameStore((s) => s.launchCampaign);
  const executeIPO = useGameStore((s) => s.executeIPO);
  const setDividendPerShare = useGameStore((s) => s.setDividendPerShare);
  const buyBackShares = useGameStore((s) => s.buyBackShares);
  const acquireCompetitor = useGameStore((s) => s.acquireCompetitor);
  const investInStartup = useGameStore((s) => s.investInStartup);
  const takeLoan = useGameStore((s) => s.takeLoan);
  const setExecutiveAutomation = useGameStore((s) => s.setExecutiveAutomation);
  const unlockResearchNode = useGameStore((s) => s.unlockResearchNode);
  const unlockMenuItem = useGameStore((s) => s.unlockMenuItem);
  const setEmployeeEquityCompensation = useGameStore((s) => s.setEmployeeEquityCompensation);
  const issueAdditionalShares = useGameStore((s) => s.issueAdditionalShares);

  const properties = useGameStore((s) => s.properties);
  const incorporate = useGameStore((s) => s.incorporate);
  const establishHoldingAction = useGameStore((s) => s.establishHoldingAction);

  const [activeDept, setActiveDept] = useState<DepartmentTabKey>('org');
  const [selectedTitle, setSelectedTitle] = useState<ExecutiveTitle | null>(null);
  const [marketingCityId, setMarketingCityId] = useState<string>(cities[0]?.id ?? '');
  const candidates = useMemo(
    () => (selectedTitle ? generateEmployeeCandidates('executive', 3, state.turn, Math.random, selectedTitle) : []),
    [selectedTitle, state.turn]
  );

  const executives = state.employees.filter((employee) => employee.role === 'executive');
  const hasExecutive = (title: ExecutiveTitle) => executives.some((executive) => executive.executiveTitle === title);

  const donutData = useMemo(
    () =>
      state.competitorBrands.map((competitor, index) => ({
        label: competitor.name,
        value: competitor.valuation,
        color: DONUT_COLORS[index % DONUT_COLORS.length],
      })),
    [state.competitorBrands]
  );
  const donutTotal = donutData.reduce((sum, slice) => sum + slice.value, 0);

  // 全都市合算・出店数ベースの市場シェア(自社を含む)。円グラフでの可視化用。
  const shareDonutData = useMemo(() => {
    const playerStores = state.stores.length;
    const competitorEntries = state.competitorBrands.map((competitor, index) => ({
      label: competitor.name,
      value: Object.values(competitor.storesByCity).reduce((sum, count) => sum + count, 0),
      color: DONUT_COLORS[(index + 1) % DONUT_COLORS.length],
    }));
    return [{ label: '自社', value: playerStores, color: colors.roast }, ...competitorEntries];
  }, [state.stores.length, state.competitorBrands]);
  const shareDonutTotal = shareDonutData.reduce((sum, slice) => sum + slice.value, 0);

  const marketShareRatio = latestBalanceSheet
    ? calculateMarketShareRatio(
        latestBalanceSheet.totalAssets,
        state.competitorBrands.map((competitor) => competitor.valuation)
      )
    : 0;

  const distinctCityCount = useMemo(() => {
    const propertyById = new Map(properties.map((property) => [property.id, property]));
    const cityIds = new Set(
      state.stores
        .map((store) => propertyById.get(store.propertyId)?.cityId)
        .filter((cityId): cityId is string => Boolean(cityId))
    );
    return cityIds.size;
  }, [state.stores, properties]);

  const creditRating = useMemo(
    () =>
      calculateCreditRating(
        buildCreditRatingInputsFromState(state, latestBalanceSheet ?? undefined, latestIncomeStatement ?? undefined)
      ),
    [state, latestBalanceSheet, latestIncomeStatement]
  );

  const ownershipComposition = useMemo(() => calculateOwnershipComposition(state.stock), [state.stock]);

  const stageMeta = ENTITY_STAGE_META[state.entityType];

  const headquartersImage = getCityImage(HEADQUARTERS_CITY_ID);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-md pb-xl">
      <GridBackdrop image={headquartersImage} className="justify-end p-md" style={{ height: 96 }}>
        <Text className="text-xl font-bold text-text-primary" style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 }}>
          企業統治
        </Text>
      </GridBackdrop>

      <View className="gap-md px-md">
      <View className="flex-row flex-wrap gap-xs">
        {TABS.map((dept) => {
          const active = dept.key === activeDept;
          return (
            <Pressable
              key={dept.key}
              className={`items-center gap-[2px] rounded-sm border py-sm ${active ? 'border-roast-dark bg-roast' : 'border-border bg-surface'}`}
              style={{ flexGrow: 1, flexBasis: '30%' }}
              onPress={() => setActiveDept(dept.key)}
            >
              <Ionicons name={dept.icon} size={18} color={active ? colors.white : colors.textSecondary} />
              <Text className={`text-[11px] font-semibold ${active ? 'text-white' : 'text-text-secondary'}`}>{dept.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeDept === 'org' ? (
        <>
          <CardBox>
            <SectionLabel icon={stageMeta.icon} label="企業成長ステージ" />
            <View className="flex-row items-center gap-sm">
              <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${stageMeta.color}26` }}>
                <Ionicons name={stageMeta.icon} size={22} color={stageMeta.color} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-text-primary">{stageMeta.label}</Text>
                <Text className="text-xs text-text-secondary">{stageMeta.description}</Text>
              </View>
            </View>
            {state.entityStatus.incorporatedAtTurn ? (
              <Text className="text-[11px] text-text-muted">法人成り: T{state.entityStatus.incorporatedAtTurn}</Text>
            ) : null}
            {state.entityStatus.holdingEstablishedAtTurn ? (
              <Text className="text-[11px] text-text-muted">HD化: T{state.entityStatus.holdingEstablishedAtTurn}</Text>
            ) : null}
          </CardBox>

          {state.entityType === 'soleProprietorship' ? (
            <CardBox>
              <SectionLabel icon="arrow-up-circle" label="法人成り(株式会社化)" />
              <Text className="text-xs text-text-secondary">
                個人の累進課税から法人税(軽減税率二段階)へ切り替わり、役員報酬・社会保険料の設計が可能になる。
              </Text>
              <RequirementRow met={state.cash >= INCORPORATION_COST} label={`手続き費用 ${formatCurrency(INCORPORATION_COST)}`} />
              <AppButton
                label={`法人成りする(${formatCurrency(INCORPORATION_COST)})`}
                icon="arrow-up-circle"
                disabled={!canIncorporate(state)}
                onPress={incorporate}
              />
            </CardBox>
          ) : null}

          {state.entityType === 'corporation' ? (
            <CardBox>
              <SectionLabel icon="layers" label="ホールディングス化" />
              <Text className="text-xs text-text-secondary">
                多店舗・多都市展開が一定規模に達すると、持株会社体制へ移行しグループ経営が可能になる。
              </Text>
              <RequirementRow met={state.stores.length >= HOLDING_MIN_STORE_COUNT} label={`保有店舗数 ${state.stores.length} / ${HOLDING_MIN_STORE_COUNT}`} />
              <RequirementRow met={distinctCityCount >= HOLDING_MIN_CITY_COUNT} label={`出店都市数 ${distinctCityCount} / ${HOLDING_MIN_CITY_COUNT}`} />
              <RequirementRow met={state.cash >= HOLDING_ESTABLISHMENT_COST} label={`設立費用 ${formatCurrency(HOLDING_ESTABLISHMENT_COST)}`} />
              <AppButton
                label={`HD体制へ移行する(${formatCurrency(HOLDING_ESTABLISHMENT_COST)})`}
                icon="layers"
                disabled={!canEstablishHolding(state, distinctCityCount)}
                onPress={() => establishHoldingAction(distinctCityCount)}
              />
            </CardBox>
          ) : null}

          {state.stock.isPublic ? (
            <CardBox>
              <SectionLabel icon="people-circle" label="取締役会の信任(株主総会)" />
              <Gauge
                label={`信任スコア ${Math.round(state.boardConfidence ?? 100)} / 100`}
                value={state.boardConfidence ?? 100}
                color={(state.boardConfidence ?? 100) <= 30 ? colors.negative : colors.positive}
              />
              <Text className="text-xs text-text-muted">
                継続的な赤字・無配・株価下落が続くと信任スコアが下がる。{colors.negative && ''}
                {(state.boardConfidence ?? 100) <= 30 ? '⚠ 解任リスクが高まっています。' : '黒字・配当・株価上昇を維持しましょう。'}
              </Text>
            </CardBox>
          ) : null}

          <CardBox>
            <SectionLabel icon="receipt" label="決算履歴" />
            {state.history.settlements.length === 0 ? (
              <Text className="text-xs text-text-muted">まだ決算が発生していません(12ターンごとに実施)</Text>
            ) : (
              [...state.history.settlements]
                .slice(-6)
                .reverse()
                .map((settlement, index) => (
                  <View
                    key={settlement.turn}
                    className={`flex-row items-center justify-between py-sm ${index === 0 ? '' : 'border-t border-border'}`}
                  >
                    <Text className="text-xs text-text-secondary">T{settlement.turn}決算</Text>
                    <Text className="text-sm font-semibold" style={{ color: colors.negative }}>
                      -{formatCurrency(settlement.totalTaxDue)}
                    </Text>
                  </View>
                ))
            )}
          </CardBox>
        </>
      ) : null}

      {activeDept === 'hq' ? (
        <>
          <CardBox>
            <SectionLabel icon="bar-chart" label="財務諸表" />
            <AppButton
              label="P&L・貸借対照表を見る"
              icon="stats-chart"
              variant="secondary"
              onPress={() => navigation.navigate('Financials')}
            />
          </CardBox>

          <CardBox>
            <SectionLabel icon="business" label="本社オフィス" />
            {state.headquarters ? (
              <>
                <Text className="text-sm text-text-primary">拡張レベル {state.headquarters.sizeTier}</Text>
                <Text className="text-sm text-text-primary">賃料 {formatCurrency(state.headquarters.rentPerMonth)} / 月</Text>
                <AppButton
                  label={`本社を拡張する(${formatCurrency(state.headquarters.sizeTier * HQ_UPGRADE_COST_PER_TIER)})`}
                  icon="arrow-up-circle"
                  onPress={upgradeHeadquartersAction}
                />
              </>
            ) : (
              <AppButton label="本社を設立する(¥800,000)" icon="business" onPress={() => establishHeadquarters(HEADQUARTERS_CITY_ID)} />
            )}
          </CardBox>

          {state.headquarters ? (
            <CardBox>
              <SectionLabel icon="layers" label="部門フロア" />
              {DEPARTMENT_ORDER.map((dept, index) => {
                const level = state.headquarters?.departments[dept]?.level ?? 0;
                const cost = calculateDepartmentUpgradeCost(level);
                const affordable = state.cash >= cost;
                return (
                  <View
                    key={dept}
                    className={`flex-row items-center justify-between py-sm ${index === 0 ? '' : 'border-t border-border'}`}
                  >
                    <View className="flex-row items-center gap-xs">
                      <Ionicons name={DEPARTMENT_ICONS[dept]} size={16} color={colors.roastLight} />
                      <Text className="text-sm text-text-primary">
                        {DEPARTMENT_LABELS[dept]}フロア(Lv{level})
                      </Text>
                    </View>
                    <Pressable
                      className={`rounded-sm bg-surface-alt px-sm py-[6px] ${affordable ? '' : 'opacity-40'}`}
                      disabled={!affordable}
                      onPress={() => upgradeDepartmentAction(dept)}
                    >
                      <Text className="text-[11px] font-semibold text-text-primary">拡張({formatCurrency(cost)})</Text>
                    </Pressable>
                  </View>
                );
              })}
            </CardBox>
          ) : null}
        </>
      ) : null}

      {activeDept === 'exec' ? (
        <>
          <CardBox>
            <SectionLabel icon="people-circle" label={`Cクラス役員(${executives.length}名)`} />
            {executives.map((executive) => (
              <Text key={executive.id} className="text-sm text-text-primary">
                {executive.name}({executive.executiveTitle}) スキル{executive.skillLevel} / 給与
                {formatCurrency(executive.salaryPerMonth)}
              </Text>
            ))}
            <View className="mt-xs flex-row gap-sm">
              {EXECUTIVE_TITLES.map((title) => (
                <Pressable
                  key={title}
                  className="flex-1 items-center rounded-sm bg-surface-alt p-sm"
                  onPress={() => setSelectedTitle(title)}
                >
                  <Text className="text-xs font-semibold text-text-primary">{title}</Text>
                </Pressable>
              ))}
            </View>
            {candidates.map((candidate) => (
              <Pressable
                key={candidate.id}
                className="flex-row items-center justify-between border-t border-border py-sm"
                onPress={() => {
                  hireExecutive(candidate);
                  setSelectedTitle(null);
                }}
              >
                <Text className="text-sm text-text-primary">{candidate.name}</Text>
                <Text className="text-sm font-semibold text-text-primary">
                  スキル{candidate.skillLevel} / {formatCurrency(candidate.salaryPerMonth)}
                </Text>
              </Pressable>
            ))}
          </CardBox>

          {executives.length > 0 ? (
            <CardBox>
              <SectionLabel icon="diamond" label="ストックオプション/RSU付与" />
              <Text className="text-xs text-text-secondary">
                役員に株式報酬(月額換算)を付与するとリテンション施策になる一方、P&Lの費用として計上される
                (現金支出は伴わない非資金費用)。
              </Text>
              {executives.map((executive, index) => {
                const granted = (executive.equityCompensationPerMonth ?? 0) > 0;
                return (
                  <View
                    key={executive.id}
                    className={`flex-row items-center justify-between py-sm ${index === 0 ? '' : 'border-t border-border'}`}
                  >
                    <View className="gap-[2px]">
                      <Text className="text-sm text-text-primary">
                        {executive.name}({executive.executiveTitle})
                      </Text>
                      <Text className="text-xs text-text-muted">
                        {granted ? `付与中 ${formatCurrency(executive.equityCompensationPerMonth ?? 0)}/月` : '未付与'}
                      </Text>
                    </View>
                    <Pressable
                      className="rounded-sm bg-surface-alt px-sm py-[6px]"
                      onPress={() =>
                        setEmployeeEquityCompensation(
                          executive.id,
                          granted ? 0 : Math.round(executive.salaryPerMonth * 0.1)
                        )
                      }
                    >
                      <Text className="text-[11px] font-semibold text-text-primary">{granted ? '解除' : '付与する'}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </CardBox>
          ) : null}

          <CardBox>
            <SectionLabel icon="options" label="権限委譲(自動化)" />
            <View className="flex-row items-center justify-between border-t border-border py-sm">
              <View className="gap-[2px]">
                <Text className="text-sm text-text-primary">CFO: 自動価格調整</Text>
                <Text className="text-xs text-text-muted">{hasExecutive('CFO') ? '雇用中' : '未雇用(効果なし)'}</Text>
              </View>
              <Switch
                value={state.executiveAutomation.autoPricing}
                onValueChange={(value) => setExecutiveAutomation({ autoPricing: value })}
                trackColor={{ true: colors.roast, false: colors.surfaceAlt }}
              />
            </View>
            <View className="flex-row items-center justify-between border-t border-border py-sm">
              <View className="gap-[2px]">
                <Text className="text-sm text-text-primary">COO: 自動採用</Text>
                <Text className="text-xs text-text-muted">{hasExecutive('COO') ? '雇用中' : '未雇用(効果なし)'}</Text>
              </View>
              <Switch
                value={state.executiveAutomation.autoHiring}
                onValueChange={(value) => setExecutiveAutomation({ autoHiring: value })}
                trackColor={{ true: colors.roast, false: colors.surfaceAlt }}
              />
            </View>
            <View className="flex-row items-center justify-between border-t border-border py-sm">
              <View className="gap-[2px]">
                <Text className="text-sm text-text-primary">CMO: 自動宣伝</Text>
                <Text className="text-xs text-text-muted">{hasExecutive('CMO') ? '雇用中' : '未雇用(効果なし)'}</Text>
              </View>
              <Switch
                value={state.executiveAutomation.autoMarketing}
                onValueChange={(value) => setExecutiveAutomation({ autoMarketing: value })}
                trackColor={{ true: colors.roast, false: colors.surfaceAlt }}
              />
            </View>
          </CardBox>

          <CardBox>
            <SectionLabel icon="pie-chart" label="部門予算(自動化の月次支出上限)" />
            <Text className="text-xs text-text-secondary">
              上限を設定すると、権限委譲がその金額を超えて自動で使い込むのを防げる(未設定=上限なし)。
            </Text>
            {(
              [
                {
                  key: 'hiringMonthlyBudget' as const,
                  label: 'COO自動採用の月次予算',
                  step: 100_000,
                },
                {
                  key: 'marketingMonthlyBudget' as const,
                  label: 'CMO自動宣伝の月次予算',
                  step: 50_000,
                },
              ]
            ).map((row, index) => {
              const current = state.executiveAutomation.departmentBudgets?.[row.key] ?? 0;
              return (
                <View key={row.key} className={`gap-xs py-sm ${index === 0 ? '' : 'border-t border-border'}`}>
                  <Text className="text-sm text-text-primary">{row.label}</Text>
                  <View className="flex-row items-center gap-sm">
                    <Pressable
                      className="h-8 w-8 items-center justify-center rounded-full bg-surface-alt"
                      onPress={() =>
                        setExecutiveAutomation({
                          departmentBudgets: {
                            ...state.executiveAutomation.departmentBudgets,
                            [row.key]: Math.max(0, current - row.step),
                          },
                        })
                      }
                    >
                      <Text className="text-base font-bold text-text-primary">-</Text>
                    </Pressable>
                    <Text className="min-w-[110px] text-center text-sm font-semibold text-text-primary">
                      {current > 0 ? formatCurrency(current) : '上限なし'}
                    </Text>
                    <Pressable
                      className="h-8 w-8 items-center justify-center rounded-full bg-surface-alt"
                      onPress={() =>
                        setExecutiveAutomation({
                          departmentBudgets: {
                            ...state.executiveAutomation.departmentBudgets,
                            [row.key]: current + row.step,
                          },
                        })
                      }
                    >
                      <Text className="text-base font-bold text-text-primary">+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </CardBox>
        </>
      ) : null}

      {activeDept === 'marketing' ? (
        <CardBox>
          <SectionLabel icon="megaphone" label="ブランド認知度(全社)" />
          <Gauge label="Brand Awareness" value={state.statuses.brandAwareness?.value ?? 0} color={colors.gold} />
        </CardBox>
      ) : null}

      {activeDept === 'marketing' ? (
        <CardBox>
          <SectionLabel icon="location" label="都市別ブランド認知度" />
          <Text className="text-xs text-text-secondary">
            都市限定キャンペーンはグローバル認知度ではなく、対象都市の認知度のみを継続的に押し上げる(期間中は毎ターン按分して効果が積み上がり、宣伝を止めると徐々に薄れる)。
          </Text>
          <View className="flex-row flex-wrap gap-xs">
            {cities.map((city) => {
              const selected = city.id === marketingCityId;
              return (
                <Pressable
                  key={city.id}
                  className={`rounded-sm border px-sm py-[6px] ${selected ? 'border-roast-dark bg-roast' : 'border-border bg-surface-alt'}`}
                  onPress={() => setMarketingCityId(city.id)}
                >
                  <Text className={`text-[11px] font-semibold ${selected ? 'text-white' : 'text-text-secondary'}`}>{city.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Gauge
            label={`${cities.find((c) => c.id === marketingCityId)?.name ?? ''} の認知度`}
            value={getCityBrandAwareness(state.brandAwarenessByCity, marketingCityId)}
            color={colors.roastLight}
          />
        </CardBox>
      ) : null}

      {activeDept === 'marketing' ? (
        <CardBox>
          <SectionLabel icon="rocket" label="マーケティングキャンペーン(段階別)" />
          <Text className="text-xs text-text-secondary">
            地域広告(ポスター等) → デジタル広告 → ブランドスポンサー(TV/大型)は認知度アップ。SNSマーケティングは安価・短期間だが入店率に直接効き、ロイヤルティ施策は長期でリピート率を底上げする。上で選択中の都市を対象に起動する。
          </Text>
          {state.activeCampaigns.map((campaign) => {
            const cityName = campaign.cityId ? cities.find((c) => c.id === campaign.cityId)?.name : null;
            return (
              <Text key={campaign.id} className="text-sm text-text-primary">
                {campaign.type}
                {cityName ? `(${cityName}限定)` : '(全社)'} — 残り{campaign.durationTurns - (state.turn - campaign.startedAtTurn)}
                ターン
              </Text>
            );
          })}
          {marketingCampaignPresets.map((preset: MarketingCampaignPreset, index) => (
            <CatalogRow key={preset.type} index={index} onPress={() => launchCampaign(preset, marketingCityId)}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text className="text-sm text-text-primary">{preset.label}</Text>
                <Text className="text-[11px] text-text-secondary">
                  認知度+{preset.awarenessEffect}
                  {preset.entryRateBonus ? ` ・入店率+${Math.round(preset.entryRateBonus * 100)}%` : ''}
                  {preset.repeatRateBonus ? ` ・リピート率+${Math.round(preset.repeatRateBonus * 100)}%` : ''}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-text-primary">
                {formatCurrency(preset.budget)}/月 x {preset.durationTurns}ターン
              </Text>
            </CatalogRow>
          ))}
        </CardBox>
      ) : null}

      {activeDept === 'ipo' ? (
        <CardBox>
          <SectionLabel icon="trending-up" label="IPO・株式" />
          {state.stock.isPublic ? (
            <>
              {state.history.stockPrices.length >= 2 ? (
                <LineChart values={state.history.stockPrices.map((point) => point.sharePrice)} color={colors.gold} />
              ) : null}
              <Text className="text-sm text-text-primary">株価 {formatCurrency(state.stock.sharePrice)}</Text>
              <Text className="text-sm text-text-primary">発行済株式数 {state.stock.totalShares.toLocaleString('ja-JP')}</Text>
              <Text className="text-sm text-text-primary">浮動株数 {state.stock.publicFloatShares.toLocaleString('ja-JP')}</Text>
              <Text className="text-sm text-text-primary">市場シェア(概算) {Math.round(marketShareRatio * 100)}%</Text>
              <Text className="text-sm text-text-primary">配当 {state.stock.dividendPerSharePerTurn.toFixed(1)} / 株 / ターン</Text>
              <View className="flex-row gap-sm">
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-surface-alt"
                  onPress={() => setDividendPerShare(state.stock.dividendPerSharePerTurn - 0.1)}
                >
                  <Text className="text-base font-bold text-text-primary">-</Text>
                </Pressable>
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-surface-alt"
                  onPress={() => setDividendPerShare(state.stock.dividendPerSharePerTurn + 0.1)}
                >
                  <Text className="text-base font-bold text-text-primary">+</Text>
                </Pressable>
              </View>
              <AppButton
                label={`自社株買い(1,000株 / ${formatCurrency(state.stock.sharePrice * 1000)})`}
                icon="repeat"
                variant="secondary"
                disabled={state.cash < state.stock.sharePrice * 1000 || state.stock.publicFloatShares < 1000}
                onPress={() => buyBackShares(1000)}
              />
            </>
          ) : (
            <AppButton
              label={`IPOを実施する(株価${formatCurrency(IPO_SHARE_PRICE)} x ${IPO_PUBLIC_FLOAT_SHARES.toLocaleString('ja-JP')}株)`}
              icon="trending-up"
              onPress={() => executeIPO(IPO_SHARE_PRICE, IPO_TOTAL_SHARES, IPO_PUBLIC_FLOAT_SHARES)}
            />
          )}
        </CardBox>
      ) : null}

      {activeDept === 'ipo' && state.stock.isPublic ? (
        <CardBox>
          <SectionLabel icon="people" label="株主構成" />
          <View className="flex-row items-center gap-md py-sm">
            <DonutChart
              data={[
                { label: '創業者', value: ownershipComposition.founderShares, color: colors.roast },
                { label: '機関投資家', value: ownershipComposition.institutionalShares, color: colors.gold },
                { label: '個人投資家', value: ownershipComposition.retailPublicShares, color: colors.positive },
              ]}
            />
            <View className="flex-1 gap-xs">
              <Text className="text-[13px] text-text-primary">創業者 {ownershipComposition.founderPercent}%</Text>
              <Text className="text-[13px] text-text-primary">機関投資家 {ownershipComposition.institutionalPercent}%</Text>
              <Text className="text-[13px] text-text-primary">個人投資家 {ownershipComposition.retailPublicPercent}%</Text>
            </View>
          </View>
          <Text className="text-xs text-text-secondary">
            公募増資(追加の新株発行)は資金調達できる一方、既存株主の持株比率を希薄化させる(dilution)。
          </Text>
          <Text className="text-[11px] text-text-muted">
            例: 5,000株を{formatCurrency(state.stock.sharePrice)}で追加発行すると調達額
            {formatCurrency(state.stock.sharePrice * 5000)}、希薄化率は約
            {Math.round((5000 / (state.stock.totalShares + 5000)) * 1000) / 10}%
          </Text>
          <AppButton
            label={`公募増資を実施する(5,000株 / ${formatCurrency(state.stock.sharePrice * 5000)}調達)`}
            icon="add-circle"
            variant="secondary"
            onPress={() => issueAdditionalShares(5000, state.stock.sharePrice)}
          />
        </CardBox>
      ) : null}

      {activeDept === 'loans' ? (
        <>
          <CardBox>
            <SectionLabel icon="shield-checkmark" label="信用格付け" />
            <View className="flex-row items-center gap-sm">
              <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${colors.gold}26` }}>
                <Text className="text-base font-bold" style={{ color: colors.gold }}>
                  {creditRating.rating}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-primary">財務健全性スコア {creditRating.score}/100</Text>
                <Text className="text-xs text-text-muted">
                  格付けが低いほど融資金利オファーが割高になる(基準金利 x{creditRating.interestRateMultiplier.toFixed(2)})
                </Text>
              </View>
            </View>
          </CardBox>
          <CardBox>
            <SectionLabel icon="wallet" label={`借入中(${state.loans.length}件)`} />
            {state.loans.length === 0 ? (
              <Text className="text-xs text-text-muted">現在借入はありません</Text>
            ) : (
              state.loans.map((loan, index) => (
                <View key={loan.id} className={`flex-row items-center justify-between py-sm ${index === 0 ? '' : 'border-t border-border'}`}>
                  <Text className="text-sm text-text-primary">残高 {formatCurrency(loan.remainingPrincipal)}</Text>
                  <Text className="text-sm font-semibold text-text-primary">
                    {formatCurrency(loan.monthlyPayment)}/月 (金利{Math.round(loan.annualInterestRate * 100)}%)
                  </Text>
                </View>
              ))
            )}
          </CardBox>
          <CardBox>
            <SectionLabel icon="cash" label="銀行融資を申し込む(格付け反映後の金利オファー)" />
            {LOAN_PRESETS.map((preset, index) => {
              const offeredRate = calculateLoanOfferRate(preset.annualInterestRate, creditRating);
              return (
                <CatalogRow key={preset.label} index={index} onPress={() => takeLoan(preset.principal, offeredRate, preset.termTurns)}>
                  <Text className="text-sm text-text-primary">{preset.label}</Text>
                  <Text className="text-sm font-semibold text-text-primary">
                    {formatCurrency(preset.principal)} / 金利{(offeredRate * 100).toFixed(1)}% / {preset.termTurns}ターン
                  </Text>
                </CatalogRow>
              );
            })}
          </CardBox>
        </>
      ) : null}

      {activeDept === 'ma' ? (
        <>
          <CardBox>
            <SectionLabel icon="pie-chart" label="市場シェア(全都市合算・出店数ベース)" />
            {shareDonutTotal > 0 ? (
              <View className="flex-row items-center gap-md py-sm">
                <DonutChart data={shareDonutData} />
                <View className="flex-1 gap-xs">
                  {shareDonutData.map((slice) => (
                    <View key={slice.label} className="flex-row items-center gap-xs">
                      <View className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: slice.color }} />
                      <Text className="flex-1 text-[13px] text-text-primary">{slice.label}</Text>
                      <Text className="text-[13px] font-semibold text-text-secondary">
                        {Math.round((slice.value / shareDonutTotal) * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text className="text-xs text-text-muted">まだどのブランドも出店していません</Text>
            )}
          </CardBox>
          <CardBox>
            <SectionLabel icon="git-merge" label="競合ブランド買収(M&A)" />
            {donutData.length > 0 ? (
              <View className="flex-row items-center gap-md py-sm">
                <DonutChart data={donutData} />
                <View className="flex-1 gap-xs">
                  {donutData.map((slice) => (
                    <View key={slice.label} className="flex-row items-center gap-xs">
                      <View className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: slice.color }} />
                      <Text className="flex-1 text-[13px] text-text-primary">{slice.label}</Text>
                      <Text className="text-[13px] font-semibold text-text-secondary">
                        {donutTotal > 0 ? Math.round((slice.value / donutTotal) * 100) : 0}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {state.competitorBrands.map((competitor, index) => {
              const price = calculateAcquisitionPrice(competitor);
              const affordable = state.cash >= price;
              return (
                <CatalogRow key={competitor.id} index={index} disabled={!affordable} onPress={() => acquireCompetitor(competitor.id)}>
                  <Text className="text-sm text-text-primary">{competitor.name}</Text>
                  <Text className="text-sm font-semibold text-text-primary">{formatCurrency(price)}</Text>
                </CatalogRow>
              );
            })}
          </CardBox>

          {state.acquisitions.length > 0 ? (
            <CardBox>
              <SectionLabel icon="receipt" label="買収履歴(店舗統合・ブランド価値の吸収)" />
              {state.acquisitions.map((acquisition, index) => (
                <View key={acquisition.id} className={`gap-[2px] py-sm ${index === 0 ? '' : 'border-t border-border'}`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-text-primary">T{acquisition.acquiredAtTurn} 買収</Text>
                    <Text className="text-sm font-semibold text-text-primary">-{formatCurrency(acquisition.price)}</Text>
                  </View>
                  {acquisition.absorbedStoreCount ? (
                    <Text className="text-xs text-text-muted">
                      吸収店舗数 {acquisition.absorbedStoreCount}店 ・ 統合一時金 +{formatCurrency(acquisition.integrationCashBonus ?? 0)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </CardBox>
          ) : null}

          <CardBox>
            <SectionLabel icon="business" label="不動産投資ポートフォリオ" />
            {state.ownedRealEstate.length === 0 ? (
              <Text className="text-xs text-text-muted">保有中の投資用不動産はありません</Text>
            ) : (
              <>
                <Text className="text-xs text-text-secondary">
                  保有件数 {state.ownedRealEstate.length}件 ・ 月次賃料収入見込 合計
                  {formatCurrency(state.ownedRealEstate.reduce((sum, re) => sum + re.monthlyRentalIncome, 0))}
                  (空室リスクにより実際の収入は変動する)
                </Text>
              </>
            )}
            <AppButton
              label="不動産投資を見る"
              icon="home"
              variant="secondary"
              onPress={() => navigation.navigate('RealEstate')}
            />
          </CardBox>

          <CardBox>
            <SectionLabel icon="rocket" label="VC/スタートアップ投資" />
            {(() => {
              const startups = state.startups ?? [];
              const portfolio = state.vcPortfolio ?? [];
              const startupsById = new Map(startups.map((s) => [s.id, s]));
              const portfolioValue = calculatePortfolioValue(portfolio, startupsById);
              const investedStartupIds = new Set(portfolio.map((inv) => inv.startupId));
              const openOpportunities = startups.filter(
                (s) => s.stage !== 'exited' && s.stage !== 'failed' && !investedStartupIds.has(s.id)
              );

              return (
                <>
                  {portfolio.length > 0 ? (
                    <Text className="text-xs text-text-secondary">
                      保有出資 {portfolio.length}件 ・ ポートフォリオ評価額 {formatCurrency(portfolioValue)}
                    </Text>
                  ) : (
                    <Text className="text-xs text-text-muted">まだ出資したスタートアップはありません</Text>
                  )}
                  {openOpportunities.length === 0 ? (
                    <Text className="text-xs text-text-muted">現在、投資可能な案件はありません(四半期ごとに補充されます)</Text>
                  ) : (
                    openOpportunities.map((startup, index) => {
                      const affordable = state.cash >= STARTUP_INVESTMENT_AMOUNT;
                      return (
                        <CatalogRow
                          key={startup.id}
                          index={index}
                          disabled={!affordable}
                          onPress={() => investInStartup(startup, STARTUP_INVESTMENT_AMOUNT)}
                        >
                          <View className="flex-1">
                            <Text className="text-sm text-text-primary">{startup.name}</Text>
                            <Text className="text-xs text-text-muted">
                              {STARTUP_SECTOR_LABELS[startup.sector]} ・ {STARTUP_STAGE_LABELS[startup.stage]} ・ 評価額{' '}
                              {formatCurrency(startup.valuation)}
                            </Text>
                          </View>
                          <Text className="text-sm font-semibold text-text-primary">{formatCurrency(STARTUP_INVESTMENT_AMOUNT)}出資</Text>
                        </CatalogRow>
                      );
                    })
                  )}
                </>
              );
            })()}
          </CardBox>

          <CardBox>
            <SectionLabel icon="storefront" label="フランチャイズ収益" />
            {(state.franchiseContracts?.length ?? 0) === 0 ? (
              <Text className="text-xs text-text-muted">
                締結中のフランチャイズ契約はありません(出店マップの「FC契約」ボタンから結べます)
              </Text>
            ) : (
              (state.franchiseContracts ?? []).map((contract, index) => (
                <CatalogRow key={contract.id} index={index}>
                  <Text className="text-sm text-text-primary">
                    {cities.find((city) => city.id === contract.cityId)?.name ?? contract.cityId}
                  </Text>
                  <Text className="text-sm font-semibold text-text-primary">
                    {formatCurrency(contract.monthlyGrossRevenueEstimate * contract.royaltyRate)}/月(ロイヤリティ{Math.round(contract.royaltyRate * 100)}%)
                  </Text>
                </CatalogRow>
              ))
            )}
          </CardBox>
        </>
      ) : null}

      {activeDept === 'research' ? (
        <>
          {RESEARCH_BRANCHES.map((branch) => (
            <CardBox key={branch}>
              <SectionLabel icon={RESEARCH_BRANCH_ICONS[branch]} label={RESEARCH_BRANCH_LABELS[branch]} />
              {researchTree
                .filter((node) => node.branch === branch)
                .sort((a, b) => a.tier - b.tier)
                .map((node, index) => {
                  const unlocked = state.researchUnlockedIds.includes(node.id);
                  const canUnlock = canUnlockResearchNode(node, state.researchUnlockedIds);
                  const affordable = state.cash >= node.cost;
                  return (
                    <View key={node.id} className={`gap-xs py-sm ${index === 0 ? '' : 'border-t border-border'}`}>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-text-primary">
                          Tier{node.tier} {node.label}
                        </Text>
                        {unlocked ? <Ionicons name="checkmark-circle" size={16} color={colors.positive} /> : null}
                      </View>
                      <Text className="text-xs text-text-muted">{node.description}</Text>
                      {!unlocked ? (
                        <AppButton
                          label={`アンロック(${formatCurrency(node.cost)})`}
                          icon="flask"
                          variant="secondary"
                          disabled={!canUnlock || !affordable}
                          onPress={() => unlockResearchNode(node.id)}
                        />
                      ) : null}
                    </View>
                  );
                })}
            </CardBox>
          ))}
        </>
      ) : null}

      {activeDept === 'menu' ? (
        <>
          {MENU_CATEGORIES.map((category) => (
            <CardBox key={category}>
              <SectionLabel icon="restaurant" label={MENU_CATEGORY_LABELS[category]} />
              {menuCatalog
                .filter((template) => template.category === category)
                .map((template, index) => {
                  const unlocked = (state.unlockedMenuItemIds ?? []).includes(template.templateId);
                  const affordable = state.cash >= template.unlockCost;
                  const margin = template.basePrice > 0 ? (template.basePrice - template.costOfGoods) / template.basePrice : 0;
                  return (
                    <View key={template.templateId} className={`gap-xs py-sm ${index === 0 ? '' : 'border-t border-border'}`}>
                      <View className="flex-row items-center justify-between">
                        <Text className="flex-shrink text-sm text-text-primary">{template.name}</Text>
                        {unlocked ? <Ionicons name="checkmark-circle" size={16} color={colors.positive} /> : null}
                      </View>
                      <Text className="text-xs text-text-muted">
                        価格目安 {formatCurrency(template.basePrice)} ・ 原価 {formatCurrency(template.costOfGoods)}(粗利
                        {Math.round(margin * 100)}%) ・ 品質{template.qualityScore}
                      </Text>
                      {!unlocked ? (
                        <AppButton
                          label={template.unlockCost > 0 ? `レシピ開発(${formatCurrency(template.unlockCost)})` : '開発済み(コストなし)'}
                          icon="flask"
                          variant="secondary"
                          disabled={!affordable}
                          onPress={() => unlockMenuItem(template.templateId)}
                        />
                      ) : (
                        <Text className="text-xs text-text-muted">各店舗の「運営」タブから追加できます</Text>
                      )}
                    </View>
                  );
                })}
            </CardBox>
          ))}
        </>
      ) : null}

      {activeDept === 'achievements' ? (
        <CardBox>
          <SectionLabel icon="trophy" label={`経営マイルストーン(${state.unlockedAchievementIds.length}/${achievements.length}達成)`} />
          {achievements.map((achievement, index) => {
            const unlocked = state.unlockedAchievementIds.includes(achievement.id);
            return (
              <View key={achievement.id} className={`flex-row items-center gap-sm py-sm ${index === 0 ? '' : 'border-t border-border'}`}>
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: unlocked ? 'rgba(232,162,61,0.22)' : 'rgba(255,255,255,0.06)' }}
                >
                  <Ionicons name="trophy" size={18} color={unlocked ? colors.gold : colors.textMuted} />
                </View>
                <View className="flex-1 gap-[2px]">
                  <Text className={`text-sm font-bold ${unlocked ? 'text-text-primary' : 'text-text-muted'}`}>
                    {achievement.label}
                  </Text>
                  <Text className="text-xs text-text-muted">{achievement.description}</Text>
                </View>
                <Text className="text-xs font-semibold" style={{ color: unlocked ? colors.positive : colors.textMuted }}>
                  {unlocked ? '達成済み' : `+${formatCurrency(achievement.rewardCash)}`}
                </Text>
              </View>
            );
          })}
        </CardBox>
      ) : null}
      </View>
    </ScrollView>
  );
}
