import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Gauge } from '../components/Gauge';
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
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { DonutChart } from '../components/DonutChart';
import { colors, spacing, radius, typography } from '../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

const EXECUTIVE_TITLES: ExecutiveTitle[] = ['CMO', 'CFO', 'COO', 'CTO'];

// 本社設立先は東京固定(MVPの簡略化。将来的に都市選択UIに拡張する)。
const HEADQUARTERS_CITY_ID = 'city-tokyo';

const IPO_SHARE_PRICE = 100;
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
  { label: '短期融資', principal: 50_000, annualInterestRate: 0.06, termTurns: 12 },
  { label: '中期融資', principal: 200_000, annualInterestRate: 0.08, termTurns: 24 },
  { label: '長期融資', principal: 1_000_000, annualInterestRate: 0.1, termTurns: 48 },
];

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
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color={colors.roastLight} />
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>企業統治</Text>

      <View style={styles.deptRow}>
        {TABS.map((dept) => {
          const active = dept.key === activeDept;
          return (
            <Pressable
              key={dept.key}
              style={[styles.deptTab, active && styles.deptTabActive]}
              onPress={() => setActiveDept(dept.key)}
            >
              <Ionicons name={dept.icon} size={18} color={active ? colors.white : colors.textSecondary} />
              <Text style={[styles.deptTabLabel, active && styles.deptTabLabelActive]}>{dept.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeDept === 'hq' ? (
        <>
          <Card>
            <SectionLabel icon="bar-chart" label="財務諸表" />
            <AppButton
              label="P&L・貸借対照表を見る"
              icon="stats-chart"
              variant="secondary"
              onPress={() => navigation.navigate('Financials')}
            />
          </Card>

          <Card>
            <SectionLabel icon="business" label="本社オフィス" />
            {state.headquarters ? (
              <>
                <Text style={styles.rowLabel}>拡張レベル {state.headquarters.sizeTier}</Text>
                <Text style={styles.rowLabel}>賃料 {formatCurrency(state.headquarters.rentPerMonth)} / 月</Text>
                <AppButton
                  label={`本社を拡張する(${formatCurrency(state.headquarters.sizeTier * 20000)})`}
                  icon="arrow-up-circle"
                  onPress={upgradeHeadquartersAction}
                />
              </>
            ) : (
              <AppButton label="本社を設立する(¥20,000)" icon="business" onPress={() => establishHeadquarters(HEADQUARTERS_CITY_ID)} />
            )}
          </Card>

          {state.headquarters ? (
            <Card>
              <SectionLabel icon="layers" label="部門フロア" />
              {DEPARTMENT_ORDER.map((dept) => {
                const level = state.headquarters?.departments[dept]?.level ?? 0;
                const cost = calculateDepartmentUpgradeCost(level);
                const affordable = state.cash >= cost;
                return (
                  <View key={dept} style={styles.catalogRow}>
                    <View style={styles.deptFloorLabel}>
                      <Ionicons name={DEPARTMENT_ICONS[dept]} size={16} color={colors.roastLight} />
                      <Text style={styles.rowLabel}>
                        {DEPARTMENT_LABELS[dept]}フロア(Lv{level})
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.smallButton, !affordable && styles.catalogRowDisabled]}
                      disabled={!affordable}
                      onPress={() => upgradeDepartmentAction(dept)}
                    >
                      <Text style={styles.smallButtonText}>拡張({formatCurrency(cost)})</Text>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          ) : null}
        </>
      ) : null}

      {activeDept === 'exec' ? (
        <>
          <Card>
            <SectionLabel icon="people-circle" label={`Cクラス役員(${executives.length}名)`} />
            {executives.map((executive) => (
              <Text key={executive.id} style={styles.rowLabel}>
                {executive.name}({executive.executiveTitle}) スキル{executive.skillLevel} / 給与
                {formatCurrency(executive.salaryPerMonth)}
              </Text>
            ))}
            <View style={styles.titleButtonRow}>
              {EXECUTIVE_TITLES.map((title) => (
                <Pressable key={title} style={styles.titleButton} onPress={() => setSelectedTitle(title)}>
                  <Text style={styles.titleButtonText}>{title}</Text>
                </Pressable>
              ))}
            </View>
            {candidates.map((candidate) => (
              <Pressable
                key={candidate.id}
                style={styles.catalogRow}
                onPress={() => {
                  hireExecutive(candidate);
                  setSelectedTitle(null);
                }}
              >
                <Text style={styles.rowLabel}>{candidate.name}</Text>
                <Text style={styles.rowValue}>
                  スキル{candidate.skillLevel} / {formatCurrency(candidate.salaryPerMonth)}
                </Text>
              </Pressable>
            ))}
          </Card>

          <Card>
            <SectionLabel icon="options" label="権限委譲(自動化)" />
            <View style={styles.automationRow}>
              <View style={styles.automationLabel}>
                <Text style={styles.rowLabel}>CFO: 自動価格調整</Text>
                <Text style={styles.subLabel}>{hasExecutive('CFO') ? '雇用中' : '未雇用(効果なし)'}</Text>
              </View>
              <Switch
                value={state.executiveAutomation.autoPricing}
                onValueChange={(value) => setExecutiveAutomation({ autoPricing: value })}
                trackColor={{ true: colors.roast, false: colors.surfaceAlt }}
              />
            </View>
            <View style={styles.automationRow}>
              <View style={styles.automationLabel}>
                <Text style={styles.rowLabel}>COO: 自動採用</Text>
                <Text style={styles.subLabel}>{hasExecutive('COO') ? '雇用中' : '未雇用(効果なし)'}</Text>
              </View>
              <Switch
                value={state.executiveAutomation.autoHiring}
                onValueChange={(value) => setExecutiveAutomation({ autoHiring: value })}
                trackColor={{ true: colors.roast, false: colors.surfaceAlt }}
              />
            </View>
            <View style={styles.automationRow}>
              <View style={styles.automationLabel}>
                <Text style={styles.rowLabel}>CMO: 自動宣伝</Text>
                <Text style={styles.subLabel}>{hasExecutive('CMO') ? '雇用中' : '未雇用(効果なし)'}</Text>
              </View>
              <Switch
                value={state.executiveAutomation.autoMarketing}
                onValueChange={(value) => setExecutiveAutomation({ autoMarketing: value })}
                trackColor={{ true: colors.roast, false: colors.surfaceAlt }}
              />
            </View>
          </Card>
        </>
      ) : null}

      {activeDept === 'marketing' ? (
        <Card>
          <SectionLabel icon="megaphone" label="ブランド認知度" />
          <Gauge label="Brand Awareness" value={state.statuses.brandAwareness?.value ?? 0} color={colors.gold} />
        </Card>
      ) : null}

      {activeDept === 'marketing' ? (
        <Card>
          <SectionLabel icon="rocket" label="マーケティングキャンペーン" />
          {state.activeCampaigns.map((campaign) => (
            <Text key={campaign.id} style={styles.rowLabel}>
              {campaign.type} — 残り{campaign.durationTurns - (state.turn - campaign.startedAtTurn)}ターン
            </Text>
          ))}
          {marketingCampaignPresets.map((preset) => (
            <Pressable key={preset.type} style={styles.catalogRow} onPress={() => launchCampaign(preset)}>
              <Text style={styles.rowLabel}>{preset.label}</Text>
              <Text style={styles.rowValue}>
                {formatCurrency(preset.budget)}/月 x {preset.durationTurns}ターン
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {activeDept === 'ipo' ? (
        <Card>
          <SectionLabel icon="trending-up" label="IPO・株式" />
          {state.stock.isPublic ? (
            <>
              <Text style={styles.rowLabel}>株価 {formatCurrency(state.stock.sharePrice)}</Text>
              <Text style={styles.rowLabel}>発行済株式数 {state.stock.totalShares.toLocaleString('ja-JP')}</Text>
              <Text style={styles.rowLabel}>浮動株数 {state.stock.publicFloatShares.toLocaleString('ja-JP')}</Text>
              <Text style={styles.rowLabel}>市場シェア(概算) {Math.round(marketShareRatio * 100)}%</Text>
              <Text style={styles.rowLabel}>
                配当 {state.stock.dividendPerSharePerTurn.toFixed(1)} / 株 / ターン
              </Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setDividendPerShare(state.stock.dividendPerSharePerTurn - 0.1)}
                >
                  <Text style={styles.stepperButtonText}>-</Text>
                </Pressable>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setDividendPerShare(state.stock.dividendPerSharePerTurn + 0.1)}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
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
        </Card>
      ) : null}

      {activeDept === 'loans' ? (
        <>
          <Card>
            <SectionLabel icon="wallet" label={`借入中(${state.loans.length}件)`} />
            {state.loans.length === 0 ? (
              <Text style={styles.subLabel}>現在借入はありません</Text>
            ) : (
              state.loans.map((loan) => (
                <View key={loan.id} style={styles.catalogRow}>
                  <Text style={styles.rowLabel}>残高 {formatCurrency(loan.remainingPrincipal)}</Text>
                  <Text style={styles.rowValue}>
                    {formatCurrency(loan.monthlyPayment)}/月 (金利{Math.round(loan.annualInterestRate * 100)}%)
                  </Text>
                </View>
              ))
            )}
          </Card>
          <Card>
            <SectionLabel icon="cash" label="銀行融資を申し込む" />
            {LOAN_PRESETS.map((preset) => (
              <Pressable
                key={preset.label}
                style={styles.catalogRow}
                onPress={() => takeLoan(preset.principal, preset.annualInterestRate, preset.termTurns)}
              >
                <Text style={styles.rowLabel}>{preset.label}</Text>
                <Text style={styles.rowValue}>
                  {formatCurrency(preset.principal)} / 金利{Math.round(preset.annualInterestRate * 100)}% /{' '}
                  {preset.termTurns}ターン
                </Text>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      {activeDept === 'ma' ? (
        <>
          <Card>
            <SectionLabel icon="pie-chart" label="市場シェア(全都市合算・出店数ベース)" />
            {shareDonutTotal > 0 ? (
              <View style={styles.donutRow}>
                <DonutChart data={shareDonutData} />
                <View style={styles.legend}>
                  {shareDonutData.map((slice) => (
                    <View key={slice.label} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                      <Text style={styles.legendLabel}>{slice.label}</Text>
                      <Text style={styles.legendValue}>
                        {Math.round((slice.value / shareDonutTotal) * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.subLabel}>まだどのブランドも出店していません</Text>
            )}
          </Card>
          <Card>
          <SectionLabel icon="git-merge" label="競合ブランド買収(M&A)" />
          {donutData.length > 0 ? (
            <View style={styles.donutRow}>
              <DonutChart data={donutData} />
              <View style={styles.legend}>
                {donutData.map((slice) => (
                  <View key={slice.label} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                    <Text style={styles.legendLabel}>{slice.label}</Text>
                    <Text style={styles.legendValue}>
                      {donutTotal > 0 ? Math.round((slice.value / donutTotal) * 100) : 0}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {state.competitorBrands.map((competitor) => {
            const price = calculateAcquisitionPrice(competitor);
            const affordable = state.cash >= price;
            return (
              <Pressable
                key={competitor.id}
                style={[styles.catalogRow, !affordable && styles.catalogRowDisabled]}
                disabled={!affordable}
                onPress={() => acquireCompetitor(competitor.id)}
              >
                <Text style={styles.rowLabel}>{competitor.name}</Text>
                <Text style={styles.rowValue}>{formatCurrency(price)}</Text>
              </Pressable>
            );
          })}
          </Card>
        </>
      ) : null}

      {activeDept === 'research' ? (
        <>
          {RESEARCH_BRANCHES.map((branch) => (
            <Card key={branch}>
              <SectionLabel icon={RESEARCH_BRANCH_ICONS[branch]} label={RESEARCH_BRANCH_LABELS[branch]} />
              {researchTree
                .filter((node) => node.branch === branch)
                .sort((a, b) => a.tier - b.tier)
                .map((node) => {
                  const unlocked = state.researchUnlockedIds.includes(node.id);
                  const canUnlock = canUnlockResearchNode(node, state.researchUnlockedIds);
                  const affordable = state.cash >= node.cost;
                  return (
                    <View key={node.id} style={styles.researchNode}>
                      <View style={styles.researchNodeHeader}>
                        <Text style={styles.rowLabel}>
                          Tier{node.tier} {node.label}
                        </Text>
                        {unlocked ? <Ionicons name="checkmark-circle" size={16} color={colors.positive} /> : null}
                      </View>
                      <Text style={styles.subLabel}>{node.description}</Text>
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
            </Card>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.title, color: colors.textPrimary },
  deptRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  deptTab: {
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deptTabActive: { backgroundColor: colors.roast, borderColor: colors.roastDark },
  deptTabLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  deptTabLabelActive: { color: colors.white },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  cardLabel: { ...typography.label, color: colors.textSecondary },
  subLabel: { fontSize: 12, color: colors.textMuted },
  rowLabel: { fontSize: 14, color: colors.textPrimary },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  titleButtonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  titleButton: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  titleButtonText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  catalogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  catalogRowDisabled: { opacity: 0.4 },
  stepper: { flexDirection: 'row', gap: spacing.sm },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  legend: { flex: 1, gap: spacing.xs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 13, color: colors.textPrimary },
  legendValue: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  deptFloorLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  smallButton: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: spacing.sm },
  smallButtonText: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
  automationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  automationLabel: { gap: 2 },
  researchNode: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  researchNodeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
