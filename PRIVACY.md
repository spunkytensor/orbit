# Privacy and external requests

Orbit is a static browser application. The current source does not implement
project accounts, analytics, advertising, or a project-operated backend. This is
not a promise about the logging, cookies, or policies of a particular deployment
host or third-party service.

| Recipient | When contacted | Information involved |
| --- | --- | --- |
| Deployment host | Loading the app and bundled assets | IP address and ordinary HTTP request metadata |
| Esri / ArcGIS | Default satellite layer | Tile requests reveal viewed geographic areas and zoom levels |
| NASA GIBS | Selecting the NASA layer | Tile requests reveal viewed geographic areas and zoom levels |
| Open-Meteo | Submitting a city-name search | The submitted search text; no remote autocomplete |
| Google Fonts | Loading the page | Font and stylesheet requests, IP address and HTTP metadata |

Requests to each external provider also expose normal connection/request metadata.
Coordinate-only searches are resolved locally. Destination thumbnails are bundled
locally, so viewing them does not contact Unsplash. Browsers may cache responses.

The app does not request browser geolocation; the crosshair fits a closer view of
the globe, not the device's GPS location. Avoid entering sensitive information in
city search. Provider policies and host configuration determine their retention
and handling of requests, which this project does not control.

Deployers should publish deployment-specific privacy information, review provider
policies, and consider self-hosting fonts or replacing services where required.
