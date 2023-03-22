import React, { Component } from 'react'
import { GoogleMap, LoadScript, Polygon, InfoWindow, Marker } from '@react-google-maps/api'
import IconButton from '@mui/material/IconButton'
import GpsFixed from '@mui/icons-material/GpsFixed'

const apiKey = 'AIzaSyC1XlvMbqs2CN_BWXFtk4BPwYWwD29cVww'

const UserLocationIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" class="css-i6dzq1">
  <circle cx="12" cy="12" r="10" stroke="blue" fill="blue" fill-opacity="0.3"></circle>
  <circle cx="12" cy="12" r="3" stroke="white" fill="blue"></circle>
</svg>
`

const plantas = [
  {
    nombre: 'Los Colorados',
    color: '#FF0000',
    centro: { lat: -24.2625, lng: -69.059 },
    areas: [
      {
        paths: [
          { lat: -24.261986, lng: -69.060333 },
          { lat: -24.26402, lng: -69.05958 },
          { lat: -24.26361, lng: -69.058039 },
          { lat: -24.261324, lng: -69.05869 }
        ],
        name: '2300 - Molienda',
        visible: true
      },
      {
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
        visible: true
      }
    ]
  },
  {
    nombre: 'Laguna Seca 1',
    color: '#FF0000',
    centro: { lat: -24.3429, lng: -69.064 },
    areas: [
      {
        paths: [
          { lat: -24.345462, lng: -69.069127 },
          { lat: -24.347056, lng: -69.065716 },
          { lat: -24.340793, lng: -69.062342 },
          { lat: -24.339379, lng: -69.065175 }
        ],
        name: '3800 - Espesadores',
        visible: true
      },
      {
        paths: [
          { lat: -24.347056, lng: -69.065716 },
          { lat: -24.340793, lng: -69.062342 },
          { lat: -24.342486, lng: -69.059275 },
          { lat: -24.34847, lng: -69.062468 }
        ],
        name: '4500 - Flotacion',
        visible: true
      },
      {
        paths: [
          { lat: -24.340793, lng: -69.062342 },
          { lat: -24.339379, lng: -69.065175 },
          { lat: -24.337287, lng: -69.06391 },
          { lat: -24.338807, lng: -69.061023 }
        ],
        name: '5863 - Area',
        visible: true
      }
    ]
  },
  {
    nombre: 'Chancado y Correas',
    color: '#FF0000',
    centro: { lat: -24.272899, lng: -69.050887 },
    areas: [
      {
        paths: [
          { lat: -24.275178, lng: -69.055543 },
          { lat: -24.27418, lng: -69.046187 },
          { lat: -24.268948, lng: -69.046649 },
          { lat: -24.269124, lng: -69.056712 }
        ],
        name: '4000 - Chancado',
        visible: true
      }
    ]
  },
  {
    nombre: 'Puerto Coloso',
    color: '#FF0000',
    centro: { lat: -23.7627, lng: -70.468 },
    areas: [
      {
        paths: [
          { lat: -23.768948, lng: -70.472057 },
          { lat: -23.766141, lng: -70.471642 },
          { lat: -23.758825, lng: -70.464623 },
          { lat: -23.756331, lng: -70.463956 },
          { lat: -23.75595, lng: -70.46763 },
          { lat: -23.764409, lng: -70.476489 }
        ],
        name: '6000 - Puerto Coloso',
        visible: true
      }
    ]
  },
  {
    nombre: 'Catodos',
    color: '#FF0000',
    centro: { lat: -24.234813, lng: -69.128289 },
    areas: [
      {
        paths: [
          { lat: -24.236574, lng: -69.131625 },
          { lat: -24.236496, lng: -69.128686 },
          { lat: -24.233414, lng: -69.126164 },
          { lat: -24.232328, lng: -69.129061 }
        ],
        name: '3259 - Catodos',
        visible: true
      }
    ]
  }
]

class Map extends Component {
  constructor(props) {
    super(props)
    this.state = {
      position: { lat: -24.261986, lng: -69.060333 },
      showInfoWindow: false,
      infoWindowPosition: null,
      plantasVisible: Array(plantas.length).fill(false),
      userLocation: null
    }
    this.handlePolygonClick = this.handlePolygonClick.bind(this)
    this.togglePlantaVisibility = this.togglePlantaVisibility.bind(this)
  }

  handlePolygonClick(e, index) {
    const content = index
    this.setState({
      showInfoWindow: true,
      infoWindowPosition: { lat: e.latLng.lat(), lng: e.latLng.lng() },
      infoWindowContent: content
    })
  }

  togglePlantaVisibility(index) {
    this.setState(
      prevState => {
        const plantasVisible = [...prevState.plantasVisible]
        plantasVisible[index] = !plantasVisible[index]

        return { plantasVisible }
      },
      () => {
        if (this.state.plantasVisible[index]) {
          this.setState({ position: plantas[index].centro })
        }
      }
    )
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
            {plantas.map((planta, index) => (
              <div key={index}>
                <label>
                  <input
                    type='checkbox'
                    checked={this.state.plantasVisible[index]}
                    onChange={() => this.togglePlantaVisibility(index)}
                  />
                  {planta.nombre}
                </label>
                <br />
              </div>
            ))}
          </div>
          <GoogleMap
            mapContainerStyle={{ height: '700px', width: '100%' }}
            center={this.state.position}
            zoom={13}
            mapTypeId='satellite'
          >
            {plantas.map((planta, plantaIndex) =>
              planta.areas.map((area, areaIndex) => (
                <Polygon
                  key={`${plantaIndex}-${areaIndex}`}
                  paths={area.paths}
                  onClick={e => this.handlePolygonClick(e, area.name)}
                  visible={this.state.plantasVisible[plantaIndex]}
                  options={{
                    fillColor: planta.color,
                    fillOpacity: 0.01,
                    strokeColor: planta.color,
                    strokeOpacity: 0.5,
                    strokeWeight: 2
                  }}
                />
              ))
            )}
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
            <IconButton
              style={{
                position: 'absolute',
                left: '10px',
                bottom: '10px',
                backgroundColor: 'white',
                color: 'black',
                zIndex: 1,
                width: '40px'
              }}
              onClick={() => {
                if (this.state.userLocation) {
                  this.setState({ position: this.state.userLocation })
                }
              }}
            >
              <GpsFixed />
            </IconButton>
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
