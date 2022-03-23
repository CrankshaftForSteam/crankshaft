import { SHARED_SELECTORS } from './selectors';
import { NetworkGetError } from './services/Network';
import { SMM } from './SMM';
import { deleteAll, info } from './util';

enum TierColours {
  pending = '#6a6a6a',
  borked = '#ff0000',
  bronze = '#cd7f32',
  silver = '#a6a6a6',
  gold = '#cfb53b',
  platinum = '#b4c7dc',
}

type TierRes = { tier: keyof typeof TierColours };

const getTierUrl = (appId: string) =>
  `https://www.protondb.com/api/v1/reports/summaries/${appId}.json`;

export const loadProtonDBPlugin = (smm: SMM) => {
  const protonDbCache: Record<string, any> = {};

  smm.addEventListener('switchToAppDetails', async (event: any) => {
    deleteAll('[data-smm-protondb]');

    const { appId, appName } = event.detail;
    let data: TierRes = protonDbCache[appId];
    if (!data) {
      try {
        data = await smm.Network.get<TierRes>(getTierUrl(appId));
        protonDbCache[appId] = data;
      } catch (err) {
        if (err instanceof NetworkGetError) {
          smm.Toast.addToast(`Error fetching ProtonDB rating for ${appName}`);
          info(`Error fetching ProtonDB rating for app ${appId}:`, err.status);
          return;
        }
      }
    }
    const { tier } = data;

    const indicator = (
      <a
        href={`https://www.protondb.com/app/${appId}`}
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: TierColours[tier],
          color: 'rgba(0, 0, 0, 50%)',
          fontSize: 20,
          textDecoration: 'none',
          borderRadius: 4,
        }}
        data-smm-protondb={true}
      >
        <img
          src={`http://localhost:${window.smmServerPort}/assets/protondb-logo.svg`}
          style={{
            width: 20,
            marginRight: 4,
          }}
        />
        <span>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
      </a>
    );

    document
      .querySelector(SHARED_SELECTORS.appDetailsHeader)!
      .appendChild(indicator);
  });
};
