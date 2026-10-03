import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

const gallery = [
  {
    src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=85',
    alt: 'Fachada contemporânea cercada por vegetação',
    label: 'Arquitetura',
  },
  {
    src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    alt: 'Sala de estar contemporânea e iluminada',
    label: 'Interiores',
  },
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    alt: 'Área externa com jardim e piscina',
    label: 'Bem-estar',
  },
];

function ArrowIcon() {
  return React.createElement('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
    React.createElement('path', { d: 'M5 12h14M13 6l6 6-6 6' }));
}

function MenuIcon({ open }) {
  return React.createElement('span', { className: `menu-lines ${open ? 'is-open' : ''}`, 'aria-hidden': 'true' },
    React.createElement('span'), React.createElement('span'));
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [sent, setSent] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || activeImage !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, activeImage]);

  const closeMenu = () => setMenuOpen(false);
  const submitContact = (event) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  return React.createElement(React.Fragment, null,
    React.createElement('header', { className: `site-header ${scrolled ? 'is-scrolled' : ''}` },
      React.createElement('a', { className: 'brand', href: '#inicio', onClick: closeMenu, 'aria-label': 'Rouxinol 763, início' },
        React.createElement('span', { className: 'brand-mark' }, 'R'),
        React.createElement('span', { className: 'brand-name' }, 'ROUXINOL', React.createElement('small', null, '763'))
      ),
      React.createElement('nav', { className: `main-nav ${menuOpen ? 'is-open' : ''}`, 'aria-label': 'Navegação principal' },
        [['O projeto', 'projeto'], ['Galeria', 'galeria'], ['Localização', 'localizacao'], ['Contato', 'contato']].map(([label, id]) =>
          React.createElement('a', { href: `#${id}`, key: id, onClick: closeMenu }, label)
        ),
        React.createElement('a', { href: '#contato', className: 'nav-cta', onClick: closeMenu }, 'Quero conhecer')
      ),
      React.createElement('button', {
        className: 'menu-button',
        type: 'button',
        onClick: () => setMenuOpen(!menuOpen),
        'aria-expanded': menuOpen,
        'aria-label': menuOpen ? 'Fechar menu' : 'Abrir menu',
      }, React.createElement(MenuIcon, { open: menuOpen }))
    ),

    React.createElement('main', null,
      React.createElement('section', { className: 'hero', id: 'inicio' },
        React.createElement('div', { className: 'hero-image', role: 'img', 'aria-label': 'Arquitetura residencial contemporânea' }),
        React.createElement('div', { className: 'hero-shade' }),
        React.createElement('div', { className: 'hero-content' },
          React.createElement('p', { className: 'eyebrow light' }, 'Vila Nova Conceição · São Paulo'),
          React.createElement('h1', null, 'Seu lugar', React.createElement('br'), 'no mundo.'),
          React.createElement('p', { className: 'hero-copy' }, 'Um endereço que conecta arquitetura, natureza e o melhor da vida urbana.'),
          React.createElement('a', { className: 'text-link light-link', href: '#projeto' }, 'Descubra o Rouxinol 763', React.createElement(ArrowIcon))
        ),
        React.createElement('a', { className: 'scroll-cue', href: '#projeto', 'aria-label': 'Rolar para conhecer o projeto' },
          React.createElement('span', null, 'Explore'), React.createElement('i')
        )
      ),

      React.createElement('section', { className: 'intro section', id: 'projeto' },
        React.createElement('div', { className: 'section-number' }, '01'),
        React.createElement('div', { className: 'intro-heading reveal' },
          React.createElement('p', { className: 'eyebrow' }, 'Av. Rouxinol, 763'),
          React.createElement('h2', null, 'Onde a cidade', React.createElement('br'), React.createElement('em', null, 'encontra pausa.'))
        ),
        React.createElement('div', { className: 'intro-copy' },
          React.createElement('p', null, 'Em uma das ruas mais desejadas da Vila Nova Conceição, o Rouxinol 763 nasce para quem valoriza tempo, beleza e uma relação mais leve com a cidade.'),
          React.createElement('p', null, 'Uma experiência residencial guiada pela atenção aos detalhes e pela conexão com o entorno.'),
          React.createElement('a', { className: 'text-link', href: '#galeria' }, 'Conheça os espaços', React.createElement(ArrowIcon))
        )
      ),

      React.createElement('section', { className: 'statement' },
        React.createElement('div', { className: 'statement-photo', role: 'img', 'aria-label': 'Detalhe de arquitetura e paisagismo' }),
        React.createElement('div', { className: 'statement-card' },
          React.createElement('span', { className: 'quote-mark' }, '“'),
          React.createElement('blockquote', null, 'Morar bem também é escolher como você quer sentir cada dia.'),
          React.createElement('p', null, 'Rouxinol 763')
        )
      ),

      React.createElement('section', { className: 'gallery-section section', id: 'galeria' },
        React.createElement('div', { className: 'section-topline' },
          React.createElement('div', { className: 'section-number' }, '02'),
          React.createElement('div', null,
            React.createElement('p', { className: 'eyebrow' }, 'Atmosferas'),
            React.createElement('h2', null, 'Espaços para', React.createElement('br'), React.createElement('em', null, 'viver o agora.'))
          ),
          React.createElement('p', { className: 'section-aside' }, 'Uma seleção visual do conceito que inspira o Rouxinol 763.')
        ),
        React.createElement('div', { className: 'gallery-grid' },
          gallery.map((image, index) => React.createElement('button', {
            className: `gallery-item gallery-item-${index + 1}`,
            key: image.src,
            type: 'button',
            onClick: () => setActiveImage(index),
            'aria-label': `Ampliar imagem: ${image.alt}`,
          },
            React.createElement('img', { src: image.src, alt: image.alt, loading: index ? 'lazy' : 'eager' }),
            React.createElement('span', null, `0${index + 1}`, React.createElement('strong', null, image.label))
          ))
        )
      ),

      React.createElement('section', { className: 'location section', id: 'localizacao' },
        React.createElement('div', { className: 'location-copy' },
          React.createElement('div', { className: 'section-number' }, '03'),
          React.createElement('p', { className: 'eyebrow' }, 'Vila Nova Conceição'),
          React.createElement('h2', null, 'Tudo por perto.', React.createElement('br'), React.createElement('em', null, 'Você no centro.')),
          React.createElement('p', null, 'Entre ruas arborizadas e a energia de São Paulo, um endereço conectado ao ritmo do bairro e às possibilidades da cidade.'),
          React.createElement('a', { className: 'text-link', href: 'https://www.google.com/maps/search/?api=1&query=Av.+Rouxinol,+763,+São+Paulo', target: '_blank', rel: 'noreferrer' }, 'Abrir no mapa', React.createElement(ArrowIcon))
        ),
        React.createElement('div', { className: 'map-art', 'aria-label': 'Mapa ilustrado da região da Avenida Rouxinol' },
          React.createElement('span', { className: 'road road-one' }),
          React.createElement('span', { className: 'road road-two' }),
          React.createElement('span', { className: 'road road-three' }),
          React.createElement('span', { className: 'road road-four' }),
          React.createElement('span', { className: 'park' }),
          React.createElement('span', { className: 'map-label label-park' }, 'Parque Ibirapuera'),
          React.createElement('span', { className: 'map-label label-avenue' }, 'Av. Rouxinol'),
          React.createElement('span', { className: 'map-pin' }, React.createElement('i'), React.createElement('b', null, '763'))
        )
      ),

      React.createElement('section', { className: 'contact section', id: 'contato' },
        React.createElement('div', { className: 'contact-heading' },
          React.createElement('p', { className: 'eyebrow light' }, 'Fale com a gente'),
          React.createElement('h2', null, 'Seu próximo', React.createElement('br'), React.createElement('em', null, 'capítulo começa aqui.')),
          React.createElement('p', null, 'Cadastre-se para receber mais informações sobre o Rouxinol 763.')
        ),
        sent ? React.createElement('div', { className: 'success-message', role: 'status' },
          React.createElement('span', null, '✓'), React.createElement('h3', null, 'Mensagem recebida.'),
          React.createElement('p', null, 'Obrigado pelo interesse. Entraremos em contato em breve.'),
          React.createElement('button', { type: 'button', onClick: () => setSent(false) }, 'Enviar outro contato')
        ) : React.createElement('form', { className: 'contact-form', onSubmit: submitContact },
          React.createElement('label', null, React.createElement('span', null, 'Nome'), React.createElement('input', { name: 'name', type: 'text', autoComplete: 'name', required: true, placeholder: 'Como podemos chamar você?' })),
          React.createElement('div', { className: 'form-row' },
            React.createElement('label', null, React.createElement('span', null, 'E-mail'), React.createElement('input', { name: 'email', type: 'email', autoComplete: 'email', required: true, placeholder: 'seu@email.com' })),
            React.createElement('label', null, React.createElement('span', null, 'Telefone'), React.createElement('input', { name: 'phone', type: 'tel', autoComplete: 'tel', required: true, placeholder: '(11) 99999-9999' }))
          ),
          React.createElement('label', { className: 'consent' }, React.createElement('input', { type: 'checkbox', required: true }), React.createElement('span', null, 'Concordo em receber informações sobre este projeto.')),
          React.createElement('button', { className: 'submit-button', type: 'submit' }, 'Quero saber mais', React.createElement(ArrowIcon))
        )
      )
    ),

    React.createElement('footer', null,
      React.createElement('a', { className: 'brand footer-brand', href: '#inicio' }, React.createElement('span', { className: 'brand-mark' }, 'R'), React.createElement('span', { className: 'brand-name' }, 'ROUXINOL', React.createElement('small', null, '763'))),
      React.createElement('p', null, 'Av. Rouxinol, 763 · Vila Nova Conceição · São Paulo'),
      React.createElement('a', { href: '#inicio' }, 'Voltar ao topo ↑')
    ),

    activeImage !== null && React.createElement('div', { className: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Imagem ampliada', onClick: () => setActiveImage(null) },
      React.createElement('button', { type: 'button', onClick: () => setActiveImage(null), 'aria-label': 'Fechar imagem' }, '×'),
      React.createElement('img', { src: gallery[activeImage].src, alt: gallery[activeImage].alt, onClick: (event) => event.stopPropagation() }),
      React.createElement('p', null, gallery[activeImage].label)
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
