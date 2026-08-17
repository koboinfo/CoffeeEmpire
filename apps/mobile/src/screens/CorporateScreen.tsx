import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Gauge } from '../components/Gauge';
import { LineChart } from '../components/LineChart';
import {
  calculateAcquisitionPrice,
  calculateDepartmentUpgradeCost,
  calculateMarketShareRatio,
  canUnlockResearchNode,
  generateEmployeeCandidates,
  marketingCampaignPresets,
  researchTree,
  type DepartmentType,
  type ExecutiveTitle,
  type ResearchBranch,
} from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import { AppButton } from '../components/AppButton';
import { DonutChart } from '../components/DonutChart';
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

type DepartmentTabKey = 'hq' | 'exec' | 'marketing' | 'ipo' | 'loans' | 'ma' | 'research';

const TABS: { key: DepartmentTabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'hq', label: '本社', icon: 'business' },
  { key: 'exec', label: '役員', icon: 'people-circle' },
  { key: 'marketing', label: '宣伝', icon: 'megaphone' },
  { key: 'ipo', label: '投資', icon: 'trending-up' },
  { key: 'loans', label: '融資', icon: 'cash' },
  { key: 'ma', label: 'M&A', icon: 'git-merge' },
  { key: 'research', label: '研究', icon: 'flask' },
];

const RESEARCH_BRANCH_LABELS: Record<ResearchBranch, string> = {
  app: 'モバイル&自社アプリ',
  eco: 'エコ&サプライチェーン',
  machine: 'マシン&品質',
};
const RESEARCH_BRANCH_ICONS: Record<ResearchBranch, keyof typeof Ionicons.glyphMap> = {
  app: 'phone-portrait',
  eco: 'leaf',
  machine: 'cafe',
};
const RESEARCH_BRANCHES: ResearchBranch[] = ['app', 'eco', 'machine'];

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
  const establishHeadquarters = useGameStore((s) => s.establishHeadquarters);
  const upgradeHeadquartersAction = useGameStore((s) => s.upgradeHeadquartersAction);
  const upgradeDepartmentAction = useGameStore((s) => s.upgradeDepartmentAction);
  const hireExecutive = useGameStore((s) => s.hireExecutive);
  const launchCampaign = useGameStore((s) => s.launchCampaign);
  const executeIPO = useGameStore((s) => s.executeIPO);
  const setDividendPerShare = useGameStore((s) => s.setDividendPerShare);
  const buyBackShares = useGameStore((s) => s.buyBackShares);
  const acquireCompetitor = useGameStore((s) => s.acquireCompetitor);
  const takeLoan = useGameStore((s) => s.takeLoan);
  const setExecutiveAutomation = useGameStore((s) => s.setExecutiveAutomation);
  const unlockResearchNode = useGameStore((s) => s.unlockResearchNode);

  const [activeDept, setActiveDept] = useState<DepartmentTabKey>('hq');
  const [selectedTitle, setSelectedTitle] = useState<ExecutiveTitle | null>(null);
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

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-md p-md pb-xl">
      <Text className="text-xl font-bold text-text-primary">企業統治</Text>

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
        </>
      ) : null}

      {activeDept === 'marketing' ? (
        <CardBox>
          <SectionLabel icon="megaphone" label="ブランド認知度" />
          <Gauge label="Brand Awareness" value={state.statuses.brandAwareness?.value ?? 0} color={colors.gold} />
        </CardBox>
      ) : null}

      {activeDept === 'marketing' ? (
        <CardBox>
          <SectionLabel icon="rocket" label="マーケティングキャンペーン" />
          {state.activeCampaigns.map((campaign) => (
            <Text key={campaign.id} className="text-sm text-text-primary">
              {campaign.type} — 残り{campaign.durationTurns - (state.turn - campaign.startedAtTurn)}ターン
            </Text>
          ))}
          {marketingCampaignPresets.map((preset, index) => (
            <CatalogRow key={preset.type} index={index} onPress={() => launchCampaign(preset)}>
              <Text className="text-sm text-text-primary">{preset.label}</Text>
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

      {activeDept === 'loans' ? (
        <>
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
            <SectionLabel icon="cash" label="銀行融資を申し込む" />
            {LOAN_PRESETS.map((preset, index) => (
              <CatalogRow key={preset.label} index={index} onPress={() => takeLoan(preset.principal, preset.annualInterestRate, preset.termTurns)}>
                <Text className="text-sm text-text-primary">{preset.label}</Text>
                <Text className="text-sm font-semibold text-text-primary">
                  {formatCurrency(preset.principal)} / 金利{Math.round(preset.annualInterestRate * 100)}% / {preset.termTurns}ターン
                </Text>
              </CatalogRow>
            ))}
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
    </ScrollView>
  );
}
