/** Entrypoint for the Chrome content_script. */

import { setEnvironment } from "../env";
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

function main(): void {
  update();
}

main();
