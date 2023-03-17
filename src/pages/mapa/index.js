import React, { Component } from 'react'
import { GoogleMap, LoadScript, Polygon, InfoWindow, Marker } from '@react-google-maps/api'

const apiKey = 'AIzaSyC1XlvMbqs2CN_BWXFtk4BPwYWwD29cVww'

const UserLocationIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" class="css-i6dzq1">
  <circle cx="12" cy="12" r="10" stroke="blue" fill="blue" fill-opacity="0.3"></circle>
  <circle cx="12" cy="12" r="3" stroke="white" fill="blue"></circle>
</svg>
`

const polygons = [
  {
    // Los Colorados
    paths: [
      { lat: -24.261986, lng: -69.060333 },
      { lat: -24.26402, lng: -69.05958 },
      { lat: -24.26361, lng: -69.058039 },
      { lat: -24.261324, lng: -69.05869 }
    ],
    name: '2300 - Molienda',
    n: 1,
    visible: true
  },
  {
    // Los Colorados
    paths: [
      { lat: -24.264679, lng: -69.058169 },
      { lat: -24.264777, lng: -69.056966 },
      { lat: -24.262995, lng: -69.056107 },
      { lat: -24.261324, lng: -69.056057 },
      { lat: -24.260808, lng: -69.054589 },
      { lat: -24.260155, lng: -69.054081 },
      { lat: -24.259365, lng: -69.054782 },
      { lat: -24.260253, lng: -69.056959 },
      { lat: -24.261382, lng: -69.057618 },
      { lat: -24.263243, lng: -69.057704 },
      { lat: -24.263948, lng: -69.058219 }
    ],
    name: '2500 - Espesadores',
    n: 2,
    visible: true
  },
  {
    // Laguna Seca 1
    paths: [
      { lat: -24.345462, lng: -69.069127 },
      { lat: -24.347056, lng: -69.065716 },
      { lat: -24.340793, lng: -69.062342 },
      { lat: -24.339379, lng: -69.065175 }
    ],
    name: '3800 - Espesadores',
    n: 3,
    visible: true
  },
  {
    // Laguna Seca 1
    paths: [
      { lat: -24.347056, lng: -69.065716 },
      { lat: -24.340793, lng: -69.062342 },
      { lat: -24.342486, lng: -69.059275 },
      { lat: -24.34847, lng: -69.062468 }
    ],
    name: '4500 - Flotacion',
    n: 4,
    visible: true
  },
  {
    // Laguna Seca 1
    paths: [
      { lat: -24.340793, lng: -69.062342 },
      { lat: -24.339379, lng: -69.065175 },
      { lat: -24.337287, lng: -69.06391 },
      { lat: -24.338807, lng: -69.061023 }
    ],
    name: '5863 - Area',
    n: 5,
    visible: true
  },
  {
    // Puerto Coloso
    paths: [
      { lat: -23.768948, lng: -70.472057 },
      { lat: -23.766141, lng: -70.471642 },
      { lat: -23.758825, lng: -70.464623 },
      { lat: -23.756331, lng: -70.463956 },
      { lat: -23.75595, lng: -70.46763 },
      { lat: -23.764409, lng: -70.476489 }
    ],
    name: '6000 - Puerto Coloso',
    n: 6,
    visible: true
  },
  {
    // Sulfuros
    paths: [
      { lat: -24.270763, lng: -69.025669 },
      { lat: -24.279488, lng: -69.017937 },
      { lat: -24.268868, lng: -69.006186 },
      { lat: -24.262813, lng: -69.015689 }
    ],
    name: 'Sulfuros',
    n: 7,
    visible: true
  }
]

class Map extends Component {
  constructor(props) {
    super(props)
    this.state = {
      position: { lat: -24.261986, lng: -69.060333 },
      showInfoWindow: false,
      infoWindowPosition: null,
      losColoradosVisible: false,
      lagunaSeca1Visible: false,
      lagunaSeca2Visible: false,
      chancadoCorreasVisible: false,
      puertoColosoVisible: false,
      vatodoVisible: false,
      lixiviacionSulfurosVisible: false
    }
    this.handlePolygonClick = this.handlePolygonClick.bind(this)
    this.toggleLosColorados = this.toggleLosColorados.bind(this)
    this.toggleLagunaSeca1 = this.toggleLagunaSeca1.bind(this)
    this.toggleLagunaSeca2 = this.toggleLagunaSeca2.bind(this)
    this.toggleChancadoCorreas = this.toggleChancadoCorreas.bind(this)
    this.togglePuertoColoso = this.togglePuertoColoso.bind(this)
    this.toggleCatodo = this.toggleCatodo.bind(this)
    this.toggleLixiviacionSulfuros = this.toggleLixiviacionSulfuros.bind(this)
  }

  handlePolygonClick(e, index) {
    const content = index
    this.setState({
      showInfoWindow: true,
      infoWindowPosition: { lat: e.latLng.lat(), lng: e.latLng.lng() },
      infoWindowContent: content
    })
  }

  toggleLosColorados() {
    this.setState(prevState => ({ losColoradosVisible: !prevState.losColoradosVisible }))
  }

  toggleLagunaSeca1() {
    this.setState(prevState => ({ lagunaSeca1Visible: !prevState.lagunaSeca1Visible }))
  }

  toggleLagunaSeca2() {
    this.setState(prevState => ({ lagunaSeca2Visible: !prevState.lagunaSeca2Visible }))
  }

  toggleChancadoCorreas() {
    this.setState(prevState => ({ chancadoCorreasVisible: !prevState.chancadoCorreasVisible }))
  }

  togglePuertoColoso() {
    this.setState(prevState => ({ puertoColosoVisible: !prevState.puertoColosoVisible }))
  }

  toggleCatodo() {
    this.setState(prevState => ({ catodoVisible: !prevState.catodoVisible }))
  }

  toggleLixiviacionSulfuros() {
    this.setState(prevState => ({ lixiviacionSulfurosVisible: !prevState.lixiviacionSulfurosVisible }))
  }

  //
  componentDidMount() {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        position => {
          this.setState({
            userLocation: { lat: position.coords.latitude, lng: position.coords.longitude }
          })
        },
        error => {
          console.error(error)
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      )
    } else {
      console.error('Geolocation is not supported by this browser.')
    }
  }

  render() {
    return (
      <LoadScript googleMapsApiKey={apiKey}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: '5px',
              borderRadius: '0px',
              marginRight: '0px',
              marginBottom: '5px'
            }}
          >
            <label>
              <input
                type='checkbox'
                checked={this.state.visibleLosColorados}
                onChange={() => this.toggleLosColorados()}
              />
              Los Colorados
            </label>
            <br />
            <label>
              <input
                type='checkbox'
                checked={this.state.visibleLagunaSeca1}
                onChange={() => this.toggleLagunaSeca1()}
              />
              Laguna Seca - 1
            </label>
            <br />
            <label>
              <input
                type='checkbox'
                checked={this.state.visibleLagunaSeca2}
                onChange={() => this.toggleLagunaSeca2()}
              />
              Laguna Seca - 2
            </label>
            <br />
            <label>
              <input
                type='checkbox'
                checked={this.state.visibleChancadoCorreas}
                onChange={() => this.toggleChancadoCorreas()}
              />
              Chancado y Correas
            </label>
            <br />
            <label>
              <input
                type='checkbox'
                checked={this.state.visiblePuertoColoso}
                onChange={() => this.togglePuertoColoso()}
              />
              Puerto Coloso
            </label>
            <br />
            <label>
              <input type='checkbox' checked={this.state.visibleCatodo} onChange={() => this.toggleCatodo()} />
              Cátodo
            </label>
            <br />
            <label>
              <input
                type='checkbox'
                checked={this.state.visibleLixiviacionSulfuros}
                onChange={() => this.toggleLixiviacionSulfuros()}
              />
              Lixiviación Sulfuros
            </label>
          </div>
          <GoogleMap
            mapContainerStyle={{ height: '700px', width: '100%' }}
            center={this.state.position}
            zoom={13}
            mapTypeId='satellite'
          >
            {polygons.map((polygon, index) => (
              <Polygon
                key={index}
                paths={polygon.paths}
                onClick={e => this.handlePolygonClick(e, polygon.name)}
                visible={
                  ((polygon.n === 1 || polygon.n === 2) && this.state.losColoradosVisible) ||
                  ((polygon.n === 3 || polygon.n === 4 || polygon.n === 5) && this.state.lagunaSeca1Visible) ||
                  (polygon.n === 6 && this.state.puertoColosoVisible) ||
                  (polygon.n === 7 && this.state.lixiviacionSulfurosVisible)
                }
                options={{
                  fillColor: polygon.n === 1 || polygon.n === 2 ? '#FF0000' : '#0000FF',
                  fillOpacity: 0.1,
                  strokeColor: polygon.n === 1 || polygon.n === 2 ? '#FF0000' : '#0000FF',
                  strokeOpacity: 0.5,
                  strokeWeight: 2
                }}
              />
            ))}
            {this.state.showInfoWindow && (
              <InfoWindow
                position={this.state.infoWindowPosition}
                onCloseClick={() => this.setState({ showInfoWindow: false })}
              >
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                  {this.state.infoWindowContent}
                </div>
              </InfoWindow>
            )}
            {this.state.userLocation && (
              <Marker
                position={this.state.userLocation}
                icon={{
                  url: `data:image/svg+xml,${encodeURIComponent(UserLocationIcon)}`
                }}
              />
            )}
          </GoogleMap>
        </div>
      </LoadScript>
    )
  }
}

export default Map

/*Map.acl = {
  action: 'manage',
  subject: 'mapa'
}*/
