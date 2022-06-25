import { useCallback } from 'preact/hooks';
import { Plugin } from '../../services/plugins';
import { ConfirmModalCancelledError } from '../../services/ui/confirm-modal';
import { SMM } from '../../smm';

export const usePluginActions = ({
  plugin,
  reloadPlugins,
  smm,
}: {
  plugin: Plugin;
  reloadPlugins: () => Promise<void>;
  smm: SMM;
}) => {
  const handleLoad = useCallback(async () => {
    await smm.Plugins.load(plugin.id);
    reloadPlugins();
  }, [plugin, reloadPlugins, smm]);

  const handleUnload = useCallback(async () => {
    await smm.Plugins.unload(plugin.id);
    reloadPlugins();
  }, [plugin, reloadPlugins, smm]);

  const handleRemove = useCallback(async () => {
    try {
      await smm.UI.confirm({
        message: `Are you sure you want to remove the plugin ${plugin.config.name}?`,
        confirmText: 'Remove plugin',
        confirmBackgroundColour: 'rgb(209, 28, 28)',
      });
      await smm.Plugins.remove(plugin.id);
      smm.Toast.addToast(`Plugin ${plugin.config.name} removed`, 'success');
    } catch (err) {
      if (err instanceof ConfirmModalCancelledError) {
        return;
      }

      console.error(err);
      smm.Toast.addToast('Error removing plugin.', 'error');
    } finally {
      reloadPlugins();
    }
  }, [plugin, reloadPlugins, smm]);

  const handleReload = useCallback(async () => {
    try {
      await smm.Plugins.reloadPlugin(plugin.id);
      smm.Toast.addToast(`${plugin.config.name} reloaded!`, 'success');
    } catch (err) {
      console.error(err);
      smm.Toast.addToast('Error reloading plugin.', 'error');
    } finally {
      reloadPlugins();
    }
  }, [plugin, reloadPlugins, smm]);

  return {
    handleLoad,
    handleUnload,
    handleReload,
    handleRemove,
  };
};
