/** Entrypoint for the Chrome content_script. */

import { setEnvironment } from "../env";
import { preloadStores } from "../storage";
import { renderBadge } from "./app";
import { DateDisplay } from "./date-display";
import { DateDisplayObserver, DocumentObserver } from "./observers";

setEnvironment("content-script");

function update(dateDisplay?: DateDisplay): void {
  dateDisplay = dateDisplay ?? DateDisplay.find();

  if (!dateDisplay) {
    const _documentObserver = new DocumentObserver((dateDisplay) => {
      update(dateDisplay);
    });

    return;
  }

  const dateDisplayObserver = new DateDisplayObserver(dateDisplay);
  dateDisplayObserver.listenRemove(() => {
    update();
  });

  renderBadge(dateDisplay, dateDisplayObserver);
}

async function main(): Promise<void> {
  await preloadStores();
  update();
}

void main();
