import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
} from '@ionic/react';

import { useLocation } from 'react-router-dom';
import { cardOutline, cashOutline, chevronForwardOutline, homeOutline, leafOutline, receiptOutline, timeOutline } from 'ionicons/icons';
import './Menu.css';

interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  title: string;
}

const appPages: AppPage[] = [
  {
    title: 'Resumen',
    url: '/folder/Resumen',
    iosIcon: homeOutline,
    mdIcon: homeOutline
  },
  {
    title: 'Ingresos',
    url: '/folder/Ingresos',
    iosIcon: cashOutline,
    mdIcon: cashOutline
  },
  {
    title: 'Gastos',
    url: '/folder/Gastos',
    iosIcon: receiptOutline,
    mdIcon: receiptOutline
  },
  {
    title: 'Deuda e inversión',
    url: '/folder/Deudas',
    iosIcon: cardOutline,
    mdIcon: cardOutline
  },
  {
    title: 'Ahorros',
    url: '/folder/Ahorros',
    iosIcon: leafOutline,
    mdIcon: leafOutline
  },
  {
    title: 'Historial',
    url: '/folder/Historial',
    iosIcon: timeOutline,
    mdIcon: timeOutline
  }
];

const Menu: React.FC = () => {
  const location = useLocation();

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList id="inbox-list">
          <IonListHeader>Finases</IonListHeader>
          <IonNote>Tu dinero, organizado</IonNote>
          {appPages.map((appPage, index) => {
            return (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem className={location.pathname === appPage.url ? 'selected' : ''} routerLink={appPage.url} routerDirection="none" lines="none" detail={false}>
                  <IonIcon aria-hidden="true" slot="start" ios={appPage.iosIcon} md={appPage.mdIcon} />
                  <IonLabel>{appPage.title}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>

        <IonList id="labels-list">
          <IonListHeader>Flujo financiero</IonListHeader>
          <IonItem lines="none" className="menu-hint">
            <IonIcon aria-hidden="true" slot="start" icon={chevronForwardOutline} />
            <IonLabel>Marca cada tarea al terminarla</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
