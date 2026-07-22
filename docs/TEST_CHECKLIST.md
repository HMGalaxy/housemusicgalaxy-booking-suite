# Galaxy Cue v10.0.3 Regression Checklist

## Authentication
- Business Login opens the authentication modal.
- Close button closes it.
- Magic-link submission reports success or a readable error.

## Navigation
- Every permanent sidebar item opens its intended view.
- Consultation and Planning template cards open their workspaces.
- Back buttons return to the correct hub.

## Clients
- Create, edit, and delete a client from Clients.
- Open the same client card in Consultation and Planning.
- Edit from Consultation and remain in Consultation after save.
- Edit from Planning and remain in Planning after save.
- New Event and linked-event buttons work from every client-card location.
- Self/third-party selection toggles Event Contact fields.

## Template Settings
- Add a custom item.
- Disable/enable it.
- Toggle Consultation and Planning visibility independently.
- Delete the custom item with confirmation.
- Built-in items cannot be deleted.

## Production Requirements
- Consultation displays only enabled Consultation items.
- Planning displays only enabled Planning items.
- Custom items appear in the correct category.
- Deleted/disabled items disappear after reopening the workspace.

## Data safety
- Local saves survive refresh.
- Cloud saves report errors instead of silently failing.
- Existing events still open after client edits.
